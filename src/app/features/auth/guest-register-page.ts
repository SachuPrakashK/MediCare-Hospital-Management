import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../core/auth/auth.store';
import { AppIcon } from '../../shared/components/icon/app-icon';
import { AuthLanguageSelector } from './auth-language-selector';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AppIcon, AuthLanguageSelector],
  templateUrl: './guest-register-page.html',
  styleUrls: ['./login-page.scss', './password-page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestRegisterPage {
  readonly auth = inject(AuthStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly form = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.maxLength(80)]],
    last_name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
    confirmation: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(128)]],
  });

  async submit() {
    if (this.auth.loading()) return;
    this.auth.error.set(null);
    this.form.markAllAsTouched();
    const confirmation = this.form.controls.confirmation;
    const existingErrors = confirmation.errors ?? {};
    if (this.form.controls.password.value !== confirmation.value && confirmation.value) {
      confirmation.setErrors({ ...existingErrors, mismatch: true });
    } else if (existingErrors['mismatch']) {
      const remainingErrors = { ...existingErrors };
      delete remainingErrors['mismatch'];
      confirmation.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }
    if (this.form.invalid) return;
    if (await this.auth.registerGuest(this.form.getRawValue()))
      void this.router.navigateByUrl('/dashboard');
  }
}
