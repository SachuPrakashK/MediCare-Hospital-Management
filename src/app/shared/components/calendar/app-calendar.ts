import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { AppIcon } from '../icon/app-icon';

interface CalendarDay {
  iso: string;
  day: number;
  currentMonth: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
}

@Component({
  selector: 'app-calendar',
  imports: [AppIcon],
  templateUrl: './app-calendar.html',
  styleUrl: './app-calendar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCalendar {
  readonly value = input('');
  readonly min = input('');
  readonly max = input('');
  readonly disabled = input(false);
  readonly ariaLabel = input('Calendar');
  readonly valueChange = output<string>();
  readonly monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ] as const;
  readonly todayIso = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  readonly month = signal(this.startOfMonth(this.value() || this.todayIso));
  readonly heading = computed(() =>
    new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      this.month(),
    ),
  );
  readonly visibleYear = computed(() => this.month().getUTCFullYear());
  readonly visibleMonth = computed(() => this.month().getUTCMonth());
  readonly years = computed(() => {
    const current = this.visibleYear();
    const minimum = this.validYear(this.min()) ?? current - 100;
    const maximum = this.validYear(this.max()) ?? current + 20;
    return Array.from(
      { length: Math.max(1, maximum - minimum + 1) },
      (_, index) => minimum + index,
    );
  });
  readonly todayAvailable = computed(() => this.withinRange(this.todayIso));
  readonly days = computed<CalendarDay[]>(() => {
    const first = this.month();
    const start = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1 - first.getUTCDay()),
    );
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const iso = date.toISOString().slice(0, 10);
      return {
        iso,
        day: date.getUTCDate(),
        currentMonth: date.getUTCMonth() === first.getUTCMonth(),
        today: iso === this.todayIso,
        selected: iso === this.value(),
        disabled: this.disabled() || !this.withinRange(iso),
      };
    });
  });
  constructor() {
    effect(() => {
      const selected = this.value();
      if (selected) this.month.set(this.startOfMonth(selected));
    });
  }
  shift(delta: number) {
    if (this.disabled()) return;
    const d = this.month();
    this.month.set(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + delta, 1)));
  }
  setMonth(month: number) {
    const current = this.month();
    this.month.set(new Date(Date.UTC(current.getUTCFullYear(), month, 1)));
  }
  setYear(year: number) {
    const current = this.month();
    this.month.set(new Date(Date.UTC(year, current.getUTCMonth(), 1)));
  }
  today() {
    if (this.disabled() || !this.todayAvailable()) return;
    this.month.set(this.startOfMonth(this.todayIso));
    this.valueChange.emit(this.todayIso);
  }
  select(day: CalendarDay) {
    if (day.disabled) return;
    this.month.set(this.startOfMonth(day.iso));
    this.valueChange.emit(day.iso);
  }
  private withinRange(iso: string) {
    return (!this.min() || iso >= this.min()) && (!this.max() || iso <= this.max());
  }
  private validYear(iso: string) {
    const year = Number(iso.slice(0, 4));
    return Number.isInteger(year) && year > 0 ? year : null;
  }
  private startOfMonth(iso: string) {
    const [y, m] = iso.split('-').map(Number);
    return new Date(Date.UTC(y || new Date().getUTCFullYear(), (m || 1) - 1, 1));
  }
}
