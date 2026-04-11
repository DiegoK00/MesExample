import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';
import { LoginArea } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>{{ area() === 1 ? 'admin_panel_settings' : 'apps' }}</mat-icon>
            {{ area() === 1 ? 'Accesso Backoffice' : 'Accesso Applicazione' }}
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="email@esempio.com">
              <mat-icon matSuffix>email</mat-icon>
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <mat-error>Email obbligatoria</mat-error>
              }
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <mat-error>Email non valida</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password">
              <button mat-icon-button matSuffix type="button" (click)="showPassword.set(!showPassword())">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <mat-error>Password obbligatoria</mat-error>
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
                Accedi
              }
            </button>
          </form>

          <div class="forgot-link">
            <a mat-button
              [routerLink]="area() === 1 ? '/admin/forgot-password' : '/app/forgot-password'">
              Password dimenticata?
            </a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f5f5;
    }
    .login-card {
      width: 400px;
      padding: 16px;
    }
    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.2rem;
    }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 16px; height: 44px; }
    .error-message { color: #f44336; font-size: 0.875rem; margin: 8px 0; }
    .forgot-link { display: flex; justify-content: center; margin-top: 8px; }
    mat-spinner { margin: 0 auto; }
  `]
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private accountService = inject(AccountService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  area = signal<LoginArea>(1);
  loading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    const area = this.route.snapshot.data['area'] as LoginArea;
    this.area.set(area);

    if (this.authService.isLoggedIn()) {
      this.router.navigate([area === 1 ? '/admin' : '/app']);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login({ ...this.form.value, area: this.area() }).subscribe({
      next: () => {
        this.accountService.getMe().subscribe({
          next: user => {
            this.authService.setCurrentUser(user);
            this.router.navigate([this.area() === 1 ? '/admin' : '/app']);
          },
          error: () => this.handleError()
        });
      },
      error: () => this.handleError()
    });
  }

  private handleError(): void {
    this.loading.set(false);
    this.errorMessage.set('Credenziali non valide. Riprova.');
  }
}
