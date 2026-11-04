import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '../../../../core/auth/auth.store';
import { AppDateTimeService } from '../../../../core/services/app-date-time.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { AIChatService } from '../../services/ai-chat.service';
import { AiraAssistant } from './aira-assistant';

describe('AiraAssistant', () => {
  let fixture: ComponentFixture<AiraAssistant>;
  const api = {
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      id: 'conversation-1',
      title: 'New conversation',
      status: 'ACTIVE',
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    get: vi.fn(),
    cancel: vi.fn(),
    stream: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiraAssistant],
      providers: [
        { provide: AIChatService, useValue: api },
        { provide: AuthStore, useValue: { has: () => true } },
        { provide: LanguageService, useValue: { current: signal('en') } },
        { provide: AppDateTimeService, useValue: { relativeTime: () => 'now' } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(AiraAssistant);
    fixture.detectChanges();
  });

  it('uses the approved launcher and welcome branding', async () => {
    const launcher = fixture.nativeElement.querySelector('.aira-launcher') as HTMLButtonElement;
    expect(launcher.textContent).toContain('Ask Aira');

    launcher.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#aira-title').textContent).toContain('Aira');
    expect(fixture.nativeElement.querySelector('.aira-welcome').textContent).toContain(
      "Hi! I'm Aira",
    );
  });

  it('switches panel direction and labels for Arabic', () => {
    TestBed.inject(LanguageService).current.set('ar');
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.aira-panel').classList).toContain('rtl');
    expect(fixture.nativeElement.querySelector('.aira-launcher').textContent).toContain(
      'اسأل Aira',
    );
  });
});
