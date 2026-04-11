import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { LoginArea } from '../../../core/models/auth.models';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const pwd = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return pwd && confirm && pwd !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <mat-card class="card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>lock_reset</mat-icon>
            Nuova password
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (!token()) {
            <div class="error-box">
              <mat-icon color="warn">error</mat-icon>
              <p>Token non valido o mancante. Richiedi un nuovo link di reset.</p>
            </div>
            <a mat-stroked-button [routerLink]="forgotPath()" class="full-width">Richiedi nuovo link</a>
          } @else if (done()) {
            <div class="success-box">
              <mat-icon color="primary">check_circle</mat-icon>
              <p>Password aggiornata con successo. Puoi ora accedere con la nuova password.</p>
            </div>
            <a mat-raised-button color="primary" [routerLink]="loginPath()" class="full-width">Vai al login</a>
          } @else {
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nuova password</mat-label>
                <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="newPassword">
                <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())">
                  <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (form.get('newPassword')?.hasError('required') && form.get('newPassword')?.touched) {
                  <mat-error>Password obbligatoria</mat-error>
                }
                @if (form.get('newPassword')?.hasError('minlength') && form.get('newPassword')?.touched) {
                  <mat-error>Minimo 8 caratteri</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Conferma password</mat-label>
                <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="confirmPassword">
                @if (form.hasError('passwordsMismatch') && form.get('confirmPassword')?.touched) {
                  <mat-error>Le password non coincidono</mat-error>
                }
              </mat-form-field>

              @if (errorMessage()) {
                <p class="error-message">{{ errorMessage() }}</p>
              }

              <button mat-raised-button color="primary" type="submit"
                class="full-width submit-btn" [disabled]="loading()">
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Imposta nuova password
                }
              </button>
            </form>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
    .card { width: 420px; padding: 16px; }
    mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1.2rem; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 8px; height: 44px; }
    .error-message { color: #f44336; font-size: 0.875rem; margin: 8px 0; }
    .success-box, .error-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px 0 24px; text-align: center; color: #444; }
    mat-spinner { margin: 0 auto; }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  area = signal<LoginArea>(1);
  token = signal('');
  loading = signal(false);
  done = signal(false);
  showPwd = signal(false);
  errorMessage = signal('');

  loginPath = () => this.area() === 1 ? '/admin/login' : '/app/login';
  forgotPath = () => this.area() === 1 ? '/admin/forgot-password' : '/app/forgot-password';

  form: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatchValidator });

  ngOnInit(): void {
    const area = this.route.snapshot.data['area'] as LoginArea;
    this.area.set(area);
    this.token.set(this.route.snapshot.queryParams['token'] ?? '');
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.resetPassword(this.token(), this.form.value.newPassword).subscribe({
      next: () => { this.loading.set(false); this.done.set(true); },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Token non valido o scaduto. Richiedi un nuovo link di reset.');
      }
    });
  }
}
