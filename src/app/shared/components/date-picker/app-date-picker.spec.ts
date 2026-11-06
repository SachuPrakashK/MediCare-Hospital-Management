import { TestBed } from '@angular/core/testing';
import { AppDatePicker } from './app-date-picker';

describe('AppDatePicker', () => {
  it('renders the form value and opens the themed calendar', () => {
    const fixture = TestBed.createComponent(AppDatePicker);
    fixture.componentInstance.writeValue('2026-11-06');
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.date-picker__control',
    ) as HTMLButtonElement;
    expect(trigger.textContent).toContain('2026-11-06');

    trigger.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-calendar')).toBeTruthy();
  });

  it('propagates a selected date and closes the popover', () => {
    const fixture = TestBed.createComponent(AppDatePicker);
    const values: string[] = [];
    fixture.componentInstance.registerOnChange((value) => values.push(value));
    fixture.componentInstance.toggle();
    fixture.componentInstance.select('2026-12-20');

    expect(values).toEqual(['2026-12-20']);
    expect(fixture.componentInstance.value()).toBe('2026-12-20');
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
