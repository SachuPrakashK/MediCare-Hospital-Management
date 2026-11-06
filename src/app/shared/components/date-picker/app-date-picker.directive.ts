import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ApplicationRef,
  ComponentRef,
  Directive,
  ElementRef,
  EnvironmentInjector,
  HostListener,
  OnDestroy,
  createComponent,
  inject,
} from '@angular/core';
import { AppCalendar } from '../calendar/app-calendar';

/** Enhances an existing native date input without changing its forms API or value format. */
@Directive({
  selector: 'input[type="date"], input[type="datetime-local"]',
  standalone: true,
})
export class AppDatePickerDirective implements AfterViewInit, OnDestroy {
  private readonly input: HTMLInputElement = inject(ElementRef<HTMLInputElement>).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly appRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private popup: HTMLElement | null = null;
  private calendar: ComponentRef<AppCalendar> | null = null;
  private originalMin = '';
  private originalMax = '';
  private originalType: 'date' | 'datetime-local' = 'date';
  private selectedDate = '';
  private timeInput: HTMLInputElement | null = null;

  ngAfterViewInit(): void {
    this.originalType = this.input.type === 'datetime-local' ? 'datetime-local' : 'date';
    this.originalMin = this.input.min;
    this.originalMax = this.input.max;
    this.input.type = 'text';
    this.input.readOnly = true;
    if (!this.input.placeholder.trim()) this.input.placeholder = this.resolvePlaceholder();
    this.input.classList.add('app-date-input');
    this.input.setAttribute('aria-haspopup', 'dialog');
    this.input.setAttribute('autocomplete', 'off');
  }

  @HostListener('click', ['$event'])
  open(event: MouseEvent): void {
    event.preventDefault();
    if (this.input.disabled || this.calendar) return;

    this.popup = this.document.createElement('div');
    this.popup.className = 'app-date-picker-overlay';
    if (this.originalType === 'datetime-local') {
      this.popup.classList.add('app-date-picker-overlay--datetime');
    }
    this.document.body.appendChild(this.popup);
    this.calendar = createComponent(AppCalendar, {
      hostElement: this.popup,
      environmentInjector: this.environmentInjector,
    });
    this.selectedDate = this.input.value.slice(0, 10);
    this.calendar.setInput('value', this.selectedDate);
    this.calendar.setInput(
      'min',
      (this.input.getAttribute('min') || this.originalMin).slice(0, 10),
    );
    this.calendar.setInput(
      'max',
      (this.input.getAttribute('max') || this.originalMax).slice(0, 10),
    );
    this.calendar.setInput('ariaLabel', this.input.getAttribute('aria-label') || 'Select date');
    this.calendar.instance.valueChange.subscribe((value) => this.select(value));
    this.appRef.attachView(this.calendar.hostView);
    if (this.originalType === 'datetime-local') this.addTimeControls();
    this.input.setAttribute('aria-expanded', 'true');
    this.input.classList.add('is-calendar-open');
    this.position();
    this.calendar.changeDetectorRef.detectChanges();
    requestAnimationFrame(() => this.position());
  }

  @HostListener('document:pointerdown', ['$event'])
  outside(event: PointerEvent): void {
    const target = event.target as Node;
    if (this.calendar && target !== this.input && !this.popup?.contains(target)) this.close();
  }

  @HostListener('document:keydown.escape')
  escape(): void {
    if (!this.calendar) return;
    this.close();
    this.input.focus();
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  position(): void {
    if (!this.popup) return;
    const trigger = this.input.getBoundingClientRect();
    const viewportWidth = this.document.documentElement.clientWidth;
    const viewportHeight = this.document.documentElement.clientHeight;
    const width = Math.min(360, viewportWidth - 24);
    const height = Math.min(this.popup.scrollHeight || 430, viewportHeight - 24);
    const left = Math.max(12, Math.min(trigger.left, viewportWidth - width - 12));
    const top =
      trigger.bottom + 8 + height <= viewportHeight
        ? trigger.bottom + 8
        : Math.max(12, trigger.top - height - 8);
    Object.assign(this.popup.style, {
      position: 'fixed',
      zIndex: '10020',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      maxWidth: 'calc(100vw - 24px)',
      maxHeight: 'calc(100vh - 24px)',
      overflowY: 'auto',
    });
  }

  ngOnDestroy(): void {
    this.close();
  }

  private select(value: string): void {
    if (this.originalType === 'datetime-local') {
      this.selectedDate = value;
      this.calendar?.setInput('value', value);
      this.calendar?.changeDetectorRef.detectChanges();
      return;
    }
    this.commit(value);
  }

  private addTimeControls(): void {
    if (!this.popup) return;
    const controls = this.document.createElement('div');
    controls.className = 'app-date-picker-time';
    const label = this.document.createElement('label');
    label.textContent = 'Time';
    this.timeInput = this.document.createElement('input');
    this.timeInput.type = 'time';
    this.timeInput.value = this.input.value.slice(11, 16) || '09:00';
    this.timeInput.setAttribute('aria-label', 'Time');
    const apply = this.document.createElement('button');
    apply.type = 'button';
    apply.className = 'primary';
    apply.textContent = 'Apply';
    apply.addEventListener('click', () => {
      if (this.selectedDate && this.timeInput?.value) {
        this.commit(`${this.selectedDate}T${this.timeInput.value}`);
      }
    });
    label.appendChild(this.timeInput);
    controls.append(label, apply);
    this.popup.appendChild(controls);
  }

  private commit(value: string): void {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    setter?.call(this.input, value);
    this.input.dispatchEvent(new Event('input', { bubbles: true }));
    this.input.dispatchEvent(new Event('change', { bubbles: true }));
    this.close();
    this.input.focus();
  }

  private close(): void {
    if (this.calendar) {
      this.appRef.detachView(this.calendar.hostView);
      this.calendar.destroy();
    }
    this.popup?.remove();
    this.calendar = null;
    this.popup = null;
    this.timeInput = null;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.classList.remove('is-calendar-open');
  }

  private resolvePlaceholder(): string {
    const control = (this.input.getAttribute('formcontrolname') || '').toLowerCase();
    const known: Record<string, string> = {
      dob: 'Select date of birth',
      dateofbirth: 'Select date of birth',
      date: 'Select appointment date',
      joiningdate: 'Select joining date',
      followupdate: 'Select follow-up date',
      startsat: 'Select start date',
      endsat: 'Select end date',
      expiresat: 'Select expiry date',
      createdfrom: 'Select start date',
      createdto: 'Select end date',
      admittedat: 'Select admission date and time',
      scheduledat: 'Select scheduled date and time',
    };
    if (known[control]) return known[control];

    const label = (
      this.input.getAttribute('aria-label') ||
      this.input.labels?.[0]?.querySelector('.form-label')?.textContent ||
      this.input.labels?.[0]?.textContent ||
      ''
    )
      .replace(/\*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    if (/\b(from|start)\b/.test(label)) return 'Select start date';
    if (/\b(to|end)\b/.test(label)) return 'Select end date';
    if (label.includes('birth')) return 'Select date of birth';
    if (label.includes('expiry') || label.includes('expiration')) return 'Select expiry date';
    if (label && label.length <= 40) {
      return `Select ${label}${label.includes('date') ? '' : ' date'}`;
    }
    return this.originalType === 'datetime-local' ? 'Select date and time' : 'Select date';
  }
}
