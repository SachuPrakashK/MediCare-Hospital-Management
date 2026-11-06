import { describe, expect, it, vi } from 'vitest';
import { AppCalendar } from './app-calendar';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('AppCalendar', () => {
  it('creates a stable six-week grid and emits selected dates', () => {
    const calendar = TestBed.runInInjectionContext(() => new AppCalendar());
    expect(calendar.days()).toHaveLength(42);
    const emitted = vi.fn();
    calendar.valueChange.subscribe(emitted);
    calendar.select(calendar.days()[10]);
    expect(emitted).toHaveBeenCalledWith(
      calendar.days().find((day) => day.selected)?.iso ?? expect.any(String),
    );
  });

  it('moves between calendar months', () => {
    const calendar = TestBed.runInInjectionContext(() => new AppCalendar());
    const before = calendar.heading();
    calendar.shift(1);
    expect(calendar.heading()).not.toBe(before);
  });

  it('offers a practical year range for birth dates and long-lived records', () => {
    const calendar = TestBed.runInInjectionContext(() => new AppCalendar());
    const years = calendar.years();
    expect(years[0]).toBe(calendar.visibleYear() - 100);
    expect(years.at(-1)).toBe(calendar.visibleYear() + 20);
  });

  it('disables constrained dates and preserves the selected month', async () => {
    await TestBed.configureTestingModule({ imports: [AppCalendar] }).compileComponents();
    const fixture: ComponentFixture<AppCalendar> = TestBed.createComponent(AppCalendar);
    fixture.componentRef.setInput('value', '2026-05-15');
    fixture.componentRef.setInput('min', '2026-05-10');
    fixture.componentRef.setInput('max', '2026-05-20');
    fixture.detectChanges();

    const calendar = fixture.componentInstance;
    const unavailable = calendar.days().find((day) => day.iso === '2026-05-09')!;
    const available = calendar.days().find((day) => day.iso === '2026-05-16')!;
    const emitted = vi.fn();
    calendar.valueChange.subscribe(emitted);

    expect(calendar.visibleMonth()).toBe(4);
    expect(unavailable.disabled).toBe(true);
    expect(available.disabled).toBe(false);
    calendar.select(unavailable);
    expect(emitted).not.toHaveBeenCalled();
  });
});
