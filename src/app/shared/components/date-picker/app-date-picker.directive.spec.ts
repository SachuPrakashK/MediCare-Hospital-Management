import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppDatePickerDirective } from './app-date-picker.directive';

@Component({
  imports: [AppDatePickerDirective],
  template: `
    <input type="date" value="2026-11-06" min="2026-01-01" />
    <label>Created from <input type="date" aria-label="Created from" /></label>
  `,
})
class DateHost {}

@Component({
  imports: [AppDatePickerDirective],
  template: '<input type="datetime-local" value="2026-11-06T10:30" />',
})
class DateTimeHost {}

describe('AppDatePickerDirective', () => {
  afterEach(() =>
    document.querySelectorAll('.app-date-picker-overlay').forEach((item) => item.remove()),
  );

  it('enhances a native date field and opens the shared calendar', () => {
    const fixture = TestBed.createComponent(DateHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;

    expect(input.type).toBe('text');
    input.click();
    fixture.detectChanges();
    expect(document.querySelector('.app-date-picker-overlay .app-calendar')).toBeTruthy();
    fixture.destroy();
  });

  it('adds a meaningful placeholder when an enhanced date field is empty', () => {
    const fixture = TestBed.createComponent(DateHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector(
      'input[aria-label="Created from"]',
    ) as HTMLInputElement;

    expect(input.placeholder).toBe('Select start date');
    fixture.destroy();
  });

  it('preserves the datetime-local value shape when applying a date and time', () => {
    const fixture = TestBed.createComponent(DateTimeHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const directive = fixture.debugElement
      .query(By.directive(AppDatePickerDirective))
      .injector.get(AppDatePickerDirective);
    input.click();
    (directive as any).select('2026-12-20');
    const time = document.querySelector('.app-date-picker-time input') as HTMLInputElement;
    time.value = '14:45';
    (document.querySelector('.app-date-picker-time button') as HTMLButtonElement).click();

    expect(input.value).toBe('2026-12-20T14:45');
    fixture.destroy();
  });
});
