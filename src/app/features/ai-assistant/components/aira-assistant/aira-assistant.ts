import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthStore } from '../../../../core/auth/auth.store';
import { AppDateTimeService } from '../../../../core/services/app-date-time.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { AIConversationSummary, AIMessage } from '../../models/ai-conversation.model';
import { AIChatService } from '../../services/ai-chat.service';

type DisplayMessage = AIMessage & { pending?: boolean };

@Component({
  selector: 'app-aira-assistant',
  imports: [FormsModule],
  templateUrl: './aira-assistant.html',
  styleUrl: './aira-assistant.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiraAssistant {
  private readonly api = inject(AIChatService);
  private readonly auth = inject(AuthStore);
  private readonly language = inject(LanguageService);
  private readonly dates = inject(AppDateTimeService);
  private readonly destroyRef = inject(DestroyRef);
  private abort?: AbortController;
  private scrollTimer?: ReturnType<typeof setTimeout>;

  @ViewChild('composer') composer?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('messageList') messageList?: ElementRef<HTMLElement>;
  readonly open = signal(false);
  readonly historyOpen = signal(false);
  readonly loading = signal(false);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly conversations = signal<AIConversationSummary[]>([]);
  readonly activeId = signal<string | null>(null);
  readonly messages = signal<DisplayMessage[]>([]);
  readonly draft = signal('');
  readonly rtl = computed(() => this.language.current().toLowerCase().startsWith('ar'));
  readonly activeTitle = computed(
    () =>
      this.conversations().find((conversation) => conversation.id === this.activeId())?.title ??
      this.text('New conversation', 'محادثة جديدة'),
  );
  readonly starterQuestions = computed(() => {
    const suggestions: string[] = [];
    if (this.auth.has('patients.view' as never))
      suggestions.push(this.text('Find a patient', 'ابحث عن مريض'));
    if (this.auth.has('appointments.view' as never))
      suggestions.push(this.text("Show today's appointments", 'اعرض مواعيد اليوم'));
    if (this.auth.has('billing.view' as never))
      suggestions.push(this.text('Check pending payments', 'تحقق من المدفوعات المعلقة'));
    if (this.auth.has('reports.view' as never))
      suggestions.push(this.text('View hospital reports', 'اعرض تقارير المستشفى'));
    if (this.auth.has('pharmacy.view' as never))
      suggestions.push(this.text('Find low-stock medicines', 'ابحث عن الأدوية منخفضة المخزون'));
    return suggestions.slice(0, 5);
  });

  constructor() {
    effect(() => {
      this.open();
      this.loading();
      this.sending();
      this.messages();
      clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => this.scrollToLatest());
    });
    this.destroyRef.onDestroy(() => clearTimeout(this.scrollTimer));
  }

  text(english: string, arabic: string) {
    return this.rtl() ? arabic : english;
  }

  async toggle() {
    this.open.update((value) => !value);
    if (this.open() && !this.conversations().length) await this.load();
    if (this.open()) setTimeout(() => this.composer?.nativeElement.focus());
  }

  close() {
    this.open.set(false);
    this.historyOpen.set(false);
  }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const conversations = await this.api.list();
      this.conversations.set(conversations);
      if (conversations[0]) await this.select(conversations[0].id);
      else await this.newConversation();
    } catch {
      this.error.set(
        this.text('Aira could not load your conversations.', 'تعذر على Aira تحميل محادثاتك.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  async newConversation() {
    if (this.sending()) return;
    this.error.set(null);
    try {
      const conversation = await this.api.create();
      this.conversations.update((items) => [conversation, ...items]);
      this.activeId.set(conversation.id);
      this.messages.set([]);
      this.historyOpen.set(false);
      setTimeout(() => this.composer?.nativeElement.focus());
    } catch {
      this.error.set(
        this.text('A new conversation could not be started.', 'تعذر بدء محادثة جديدة.'),
      );
    }
  }

  async select(id: string) {
    if (this.sending()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const conversation = await this.api.get(id);
      this.activeId.set(id);
      this.messages.set(conversation.messages);
      this.historyOpen.set(false);
    } catch {
      this.error.set(
        this.text('This conversation could not be loaded.', 'تعذر تحميل هذه المحادثة.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  useSuggestion(question: string) {
    this.draft.set(question);
    void this.send();
  }

  async send() {
    const content = this.draft().trim();
    const conversationId = this.activeId();
    if (!content || !conversationId || this.sending()) return;
    this.draft.set('');
    this.error.set(null);
    this.sending.set(true);
    const now = new Date().toISOString();
    const userMessage: DisplayMessage = {
      id: `local-user-${Date.now()}`,
      role: 'USER',
      content,
      status: 'COMPLETED',
      createdAt: now,
    };
    const assistantId = `local-assistant-${Date.now()}`;
    this.messages.update((items) => [
      ...items,
      userMessage,
      {
        id: assistantId,
        role: 'ASSISTANT',
        content: '',
        status: 'COMPLETED',
        createdAt: now,
        pending: true,
      },
    ]);
    this.abort = new AbortController();
    try {
      await this.api.stream(
        conversationId,
        content,
        (text) =>
          this.messages.update((items) =>
            items.map((item) =>
              item.id === assistantId
                ? { ...item, content: item.content + text, pending: false }
                : item,
            ),
          ),
        this.abort.signal,
      );
      await this.refreshHistory();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.messages.update((items) => items.filter((item) => item.id !== assistantId));
        this.error.set(
          error instanceof Error
            ? error.message
            : this.text('Aira could not respond.', 'تعذر على Aira الرد.'),
        );
      }
    } finally {
      this.sending.set(false);
      this.abort = undefined;
    }
  }

  async stop() {
    const id = this.activeId();
    this.abort?.abort();
    if (id) await this.api.cancel(id).catch(() => undefined);
    this.sending.set(false);
  }

  retry() {
    const lastUser = [...this.messages()].reverse().find((message) => message.role === 'USER');
    if (!lastUser) return;
    this.draft.set(lastUser.content);
    void this.send();
  }

  async copy(message: DisplayMessage) {
    await navigator.clipboard?.writeText(message.content);
  }

  relativeTime(value: string) {
    return this.dates.relativeTime(value);
  }

  onComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.send();
    }
  }

  @HostListener('document:keydown.escape') onEscape() {
    if (this.historyOpen()) this.historyOpen.set(false);
    else if (this.open()) this.close();
  }

  private async refreshHistory() {
    const conversations = await this.api.list();
    this.conversations.set(conversations);
  }

  private scrollToLatest() {
    const container = this.messageList?.nativeElement;
    if (!container || !this.open()) return;
    container.scrollTop = container.scrollHeight;
  }
}
