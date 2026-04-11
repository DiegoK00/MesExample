import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { LoginArea } from '../../../core/models/auth.models';

@Component({
  selector: 'app-forgot-password',
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
            Password dimenticata
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          @if (sent()) {
            <div class="success-box">
              <mat-icon color="primary">check_circle</mat-icon>
              <p>Se l'indirizzo è registrato, riceverai un'email con le istruzioni per reimpostare la password.</p>
            </div>
            <a mat-stroked-button [routerLink]="loginPath()" class="full-width back-btn">
              Torna al login
            </a>
          } @else {
            <p class="hint">Inserisci l'email associata al tuo account. Riceverai un link per reimpostare la password.</p>

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

              <button mat-raised-button color="primary" type="submit"
                class="full-width submit-btn" [disabled]="loading()">
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Invia istruzioni
                }
              </button>
            </form>

            <div class="links">
              <a mat-button [routerLink]="loginPath()">Torna al login</a>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container { height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f5f5; }
    .card { width: 420px; padding: 16px; }
    mat-card-title { display: flex; align-items: center; gap: 8px; font-size: 1.2rem; }
    .hint { color: #666; font-size: 0.9rem; margin: 8px 0 16px; }
    .full-width { width: 100%; }
    .submit-btn { margin-top: 8px; height: 44px; }
    .back-btn { margin-top: 16px; }
    .links { display: flex; justify-content: center; margin-top: 12px; }
    .success-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px 0; text-align: center; color: #444; }
    mat-spinner { margin: 0 auto; }
  `]
})
export class ForgotPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);

  area = signal<LoginArea>(1);
  loading = signal(false);
  sent = signal(false);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loginPath = () => this.area() === 1 ? '/admin/login' : '/app/login';

  ngOnInit(): void {
    const area = this.route.snapshot.data['area'] as LoginArea;
    this.area.set(area);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.authService.forgotPassword(this.form.value.email, this.area()).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); } // sempre true: anti-enumeration
    });
  }
}
