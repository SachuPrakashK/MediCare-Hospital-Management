import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthStore } from '../../../core/auth/auth.store';
import { AIConversation, AIConversationSummary } from '../models/ai-conversation.model';

type ApiResponse<T> = { data: T };

@Injectable({ providedIn: 'root' })
export class AIChatService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthStore);

  list() {
    return firstValueFrom(
      this.http.get<ApiResponse<AIConversationSummary[]>>('/api/v1/ai/conversations'),
    ).then((response) => response.data);
  }

  create() {
    return firstValueFrom(
      this.http.post<ApiResponse<AIConversationSummary>>('/api/v1/ai/conversations', {}),
    ).then((response) => response.data);
  }

  get(id: string) {
    return firstValueFrom(
      this.http.get<ApiResponse<AIConversation>>(`/api/v1/ai/conversations/${id}`),
    ).then((response) => response.data);
  }

  remove(id: string) {
    return firstValueFrom(this.http.delete(`/api/v1/ai/conversations/${id}`));
  }

  cancel(id: string) {
    return firstValueFrom(this.http.post(`/api/v1/ai/conversations/${id}/cancel`, {}));
  }

  async stream(id: string, content: string, onDelta: (text: string) => void, signal: AbortSignal) {
    const token = this.auth.session()?.accessToken;
    const response = await fetch(`/api/v1/ai/conversations/${id}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
      signal,
    });
    if (!response.ok || !response.body) throw new Error('Aira is currently unavailable.');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';
      for (const event of events) {
        const type = event.match(/^event:\s*(.+)$/m)?.[1];
        const raw = event.match(/^data:\s*(.+)$/m)?.[1];
        if (!raw) continue;
        const payload = JSON.parse(raw) as { text?: string; message?: string };
        if (type === 'delta' && payload.text) onDelta(payload.text);
        if (type === 'error') throw new Error(payload.message ?? 'Aira could not respond.');
      }
      if (done) break;
    }
  }
}
