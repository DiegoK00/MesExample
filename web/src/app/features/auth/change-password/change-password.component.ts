import { Component, signal, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AccountService } from '../../../core/services/account.service';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPwd = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  return newPwd && confirm && newPwd !== confirm ? { passwordsMismatch: true } : null;
}

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>lock</mat-icon>
      Cambia password
    </h2>

    <mat-dialog-content>
      @if (success()) {
        <div class="success-box">
          <mat-icon color="primary">check_circle</mat-icon>
          <p>Password aggiornata con successo.</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" id="change-pwd-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password attuale</mat-label>
            <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="currentPassword">
            <button mat-icon-button matSuffix type="button" (click)="showPwd.set(!showPwd())">
              <mat-icon>{{ showPwd() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('currentPassword')?.hasError('required') && form.get('currentPassword')?.touched) {
              <mat-error>Password attuale obbligatoria</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nuova password</mat-label>
            <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="newPassword">
            @if (form.get('newPassword')?.hasError('required') && form.get('newPassword')?.touched) {
              <mat-error>Nuova password obbligatoria</mat-error>
            }
            @if (form.get('newPassword')?.hasError('minlength') && form.get('newPassword')?.touched) {
              <mat-error>Minimo 8 caratteri</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Conferma nuova password</mat-label>
            <input matInput [type]="showPwd() ? 'text' : 'password'" formControlName="confirmPassword">
            @if (form.hasError('passwordsMismatch') && form.get('confirmPassword')?.touched) {
              <mat-error>Le password non coincidono</mat-error>
            }
          </mat-form-field>

          @if (errorMessage()) {
            <p class="error-message">{{ errorMessage() }}</p>
          }
        </form>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annulla</button>
      @if (!success()) {
        <button mat-raised-button color="primary"
          type="submit" form="change-pwd-form" [disabled]="loading()">
          @if (loading()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Salva
          }
        </button>
      } @else {
        <button mat-raised-button color="primary" mat-dialog-close>Chiudi</button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 8px; }
    mat-dialog-content { min-width: 360px; padding-top: 8px; }
    .full-width { width: 100%; margin-bottom: 4px; }
    .error-message { color: #f44336; font-size: 0.875rem; margin: 4px 0 8px; }
    .success-box { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 24px 0; text-align: center; color: #444; }
    mat-spinner { margin: 0 auto; }
  `]
})
export class ChangePasswordComponent {
  private accountService = inject(AccountService);
  private dialogRef = inject(MatDialogRef<ChangePasswordComponent>);
  private fb = inject(FormBuilder);

  loading = signal(false);
  success = signal(false);
  showPwd = signal(false);
  errorMessage = signal('');

  form: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatchValidator });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    const { currentPassword, newPassword } = this.form.value;
    this.accountService.changePassword(currentPassword, newPassword).subscribe({
      next: () => { this.loading.set(false); this.success.set(true); },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Password attuale non corretta.');
      }
    });
  }
}
