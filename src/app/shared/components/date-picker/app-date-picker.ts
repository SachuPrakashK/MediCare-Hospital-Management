import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppCalendar } from '../calendar/app-calendar';
import { AppIcon } from '../icon/app-icon';

@Component({
  selector: 'app-date-picker',
  imports: [AppCalendar, AppIcon],
  templateUrl: './app-date-picker.html',
  styleUrl: './app-date-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppDatePicker),
      multi: true,
    },
  ],
})
export class AppDatePicker implements ControlValueAccessor {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly document = inject(DOCUMENT);
  readonly min = input('');
  readonly max = input('');
  readonly placeholder = input('Select date');
  readonly ariaLabel = input('Select date');
  readonly value = signal('');
  readonly open = signal(false);
  readonly disabled = signal(false);
  readonly popupStyle = signal<Record<string, string>>({});
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) this.close();
  }

  toggle(): void {
    if (this.disabled()) return;
    this.open() ? this.close() : this.show();
  }

  select(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
    this.close();
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.select('');
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:pointerdown', ['$event'])
  outsideClick(event: PointerEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) this.close();
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    if (this.open()) {
      this.close();
      this.host.nativeElement.querySelector<HTMLElement>('.date-picker__control')?.focus();
    }
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  reposition(): void {
    if (this.open()) this.positionPopup();
  }

  private show(): void {
    this.open.set(true);
    requestAnimationFrame(() => this.positionPopup());
  }

  private positionPopup(): void {
    const trigger = this.host.nativeElement.getBoundingClientRect();
    const viewportWidth = this.document.documentElement.clientWidth;
    const viewportHeight = this.document.documentElement.clientHeight;
    const width = Math.min(360, viewportWidth - 24);
    const left = Math.max(12, Math.min(trigger.left, viewportWidth - width - 12));
    const popup = this.host.nativeElement.querySelector<HTMLElement>('.date-picker__popup');
    const estimatedHeight = Math.min(popup?.scrollHeight || 430, viewportHeight - 24);
    const below = trigger.bottom + 8;
    const top =
      below + estimatedHeight <= viewportHeight
        ? below
        : Math.max(12, trigger.top - estimatedHeight - 8);
    this.popupStyle.set({ left: `${left}px`, top: `${top}px`, width: `${width}px` });
  }
}
