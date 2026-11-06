import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppNotification, NotificationStore } from '../../core/notifications/notification.store';

interface NotificationPageResponse {
  data: AppNotification[];
  pagination: { page: number; page_size: number; total: number; total_pages: number };
}

@Injectable()
export class NotificationsPageState {
  private readonly http = inject(HttpClient);
  private readonly global = inject(NotificationStore);
  readonly notifications = signal<AppNotification[]>([]);
  readonly loading = signal(false);
  readonly actionInProgress = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly search = signal('');
  readonly status = signal<'all' | 'unread' | 'read'>('all');
  readonly pagination = signal({ page: 1, pageSize: 20, total: 0, totalPages: 0 });

  async load(page = 1, pageSize = this.pagination().pageSize) {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const params = new HttpParams()
        .set('page', page)
        .set('page_size', pageSize)
        .set('search', this.search())
        .set('status', this.status());
      const response = await firstValueFrom(
        this.http.get<NotificationPageResponse>('/api/v1/notifications', { params }),
      );
      this.notifications.set(response.data);
      this.pagination.set({
        page: response.pagination.page,
        pageSize: response.pagination.page_size,
        total: response.pagination.total,
        totalPages: response.pagination.total_pages,
      });
    } catch {
      this.error.set('Notifications could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  async setSearch(search: string) {
    this.search.set(search);
    await this.load(1);
  }

  async setStatus(status: 'all' | 'unread' | 'read') {
    this.status.set(status);
    await this.load(1);
  }

  async markRead(item: AppNotification) {
    if (item.isRead || this.actionInProgress()) return;
    this.actionInProgress.set(item.id);
    try {
      await this.global.markRead(item);
      this.notifications.update((items) =>
        items.map((current) =>
          current.id === item.id
            ? { ...current, isRead: true, readAt: new Date().toISOString() }
            : current,
        ),
      );
    } catch {
      this.error.set('The notification could not be marked as read.');
    } finally {
      this.actionInProgress.set(null);
    }
  }

  async markAllRead() {
    if (this.actionInProgress()) return;
    this.actionInProgress.set('all');
    try {
      await this.global.markAllRead();
      await this.load(this.pagination().page);
    } catch {
      this.error.set('Notifications could not be marked as read.');
    } finally {
      this.actionInProgress.set(null);
    }
  }

  async dismiss(item: AppNotification) {
    if (this.actionInProgress()) return;
    this.actionInProgress.set(item.id);
    try {
      await firstValueFrom(this.http.delete(`/api/v1/notifications/${item.id}`));
      await Promise.all([this.load(this.pagination().page), this.global.load()]);
    } catch {
      this.error.set('The notification could not be dismissed.');
    } finally {
      this.actionInProgress.set(null);
    }
  }
}
