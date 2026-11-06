import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { AppPagination } from '../../shared/components/pagination/app-pagination';
import { AppDateTimePipe } from '../../core/services/app-date-time.service';
import { SearchField } from '../../shared/components/search/search-field';
import { AppIcon } from '../../shared/components/icon/app-icon';
import { NotificationsPageState } from './notifications-page.state';
@Component({
  imports: [FormsModule, EmptyState, AppPagination, AppDateTimePipe, SearchField, AppIcon],
  templateUrl: './notifications-page.html',
  styleUrl: './notifications-page.scss',
  providers: [NotificationsPageState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPage {
  readonly store = inject(NotificationsPageState);
  constructor() {
    void this.store.load();
  }
}
