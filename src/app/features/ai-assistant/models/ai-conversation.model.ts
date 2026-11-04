export interface AIMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  status: 'COMPLETED' | 'CANCELLED' | 'FAILED';
  createdAt: string;
}

export interface AIConversationSummary {
  id: string;
  title: string;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversation extends AIConversationSummary {
  messages: AIMessage[];
}
