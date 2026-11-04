import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import { aiProviderService, type AIProviderEvent } from './ai-provider.service.js';
import { aiToolService } from './ai-tool.service.js';

const MAX_CONTEXT_MESSAGES = 20;
const activeGenerations = new Map<string, { userId: string; controller: AbortController }>();

const expiryDate = () => {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + env.AI_CONVERSATION_RETENTION_DAYS);
  return value;
};

const titleFor = (message: string) =>
  message.replace(/\s+/g, ' ').trim().slice(0, 80) || 'New conversation';

export class AIConversationService {
  private async owned(id: string, userId: string) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id, userId, expiresAt: { gt: new Date() } },
    });
    if (!conversation)
      throw new AppError(404, 'Conversation was not found.', 'AI_CONVERSATION_NOT_FOUND');
    return conversation;
  }

  async create(userId: string) {
    const conversation = await prisma.aIConversation.create({
      data: { userId, expiresAt: expiryDate() },
    });
    await this.audit(userId, 'AI_CONVERSATION_CREATED', conversation.id);
    return conversation;
  }

  async list(userId: string) {
    await prisma.aIConversation.deleteMany({ where: { userId, expiresAt: { lte: new Date() } } });
    return prisma.aIConversation.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { lastMessageAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        status: true,
        lastMessageAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async detail(id: string, userId: string) {
    await this.owned(id, userId);
    return prisma.aIConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 100 } },
    });
  }

  async remove(id: string, userId: string) {
    await this.owned(id, userId);
    this.cancel(id, userId);
    await prisma.aIConversation.delete({ where: { id } });
    await this.audit(userId, 'AI_CONVERSATION_DELETED', id);
  }

  async *send(
    id: string,
    userId: string,
    permissions: string[],
    content: string,
  ): AsyncGenerator<AIProviderEvent> {
    const conversation = await this.owned(id, userId);
    if (!aiProviderService.available()) {
      throw new AppError(
        503,
        'Aira is not connected to an AI provider. Please contact your administrator.',
        'AI_PROVIDER_UNAVAILABLE',
      );
    }
    if (activeGenerations.has(id))
      throw new AppError(409, 'A response is already being generated.', 'AI_RESPONSE_IN_PROGRESS');

    await prisma.aIMessage.create({
      data: { conversationId: id, role: 'USER', content },
    });
    await prisma.aIConversation.update({
      where: { id },
      data: {
        title: conversation.title === 'New conversation' ? titleFor(content) : conversation.title,
        lastMessageAt: new Date(),
        expiresAt: expiryDate(),
      },
    });
    const history = await prisma.aIMessage.findMany({
      where: { conversationId: id, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: MAX_CONTEXT_MESSAGES,
    });
    const controller = new AbortController();
    activeGenerations.set(id, { userId, controller });
    let response = '';
    let usage: AIProviderEvent['usage'];
    let status = 'COMPLETED';
    try {
      const toolResult = await aiToolService.execute(content, permissions);
      if (toolResult?.toolIds.length) {
        await this.audit(userId, 'AI_TOOLS_EXECUTED', id, { tools: toolResult.toolIds });
      }
      for await (const event of aiProviderService.stream(
        history.reverse().map((message) => ({
          role: message.role === 'USER' ? ('user' as const) : ('assistant' as const),
          content: message.content,
        })),
        controller.signal,
        toolResult?.context,
      )) {
        if (event.text) response += event.text;
        if (event.usage) usage = event.usage;
        yield event;
      }
    } catch (error) {
      if (controller.signal.aborted) status = 'CANCELLED';
      else {
        status = 'FAILED';
        throw error;
      }
    } finally {
      activeGenerations.delete(id);
      if (response.trim()) {
        await prisma.aIMessage.create({
          data: {
            conversationId: id,
            role: 'ASSISTANT',
            content: response,
            status,
            inputTokens: usage?.inputTokens,
            outputTokens: usage?.outputTokens,
          },
        });
        await prisma.aIConversation.update({
          where: { id },
          data: { lastMessageAt: new Date(), expiresAt: expiryDate() },
        });
      }
      const action =
        status === 'CANCELLED'
          ? 'AI_RESPONSE_CANCELLED'
          : status === 'FAILED'
            ? 'AI_RESPONSE_FAILED'
            : 'AI_RESPONSE_GENERATED';
      await this.audit(userId, action, id, {
        status,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
      });
    }
  }

  cancel(id: string, userId: string) {
    const active = activeGenerations.get(id);
    if (active?.userId === userId) active.controller.abort();
    return Boolean(active?.userId === userId);
  }

  private audit(userId: string, action: string, entityId: string, metadata?: object) {
    return prisma.auditLog.create({
      data: {
        userId,
        action,
        module: 'AI_ASSISTANT',
        entityType: 'AIConversation',
        entityId,
        metadata,
      },
    });
  }
}

export const aiConversationService = new AIConversationService();
