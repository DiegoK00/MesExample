import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UsersService } from '../../../core/services/users.service';
import { UserResponse } from '../../../core/models/user.models';

export interface UserDialogData {
  user?: UserResponse;
}

interface RoleOption {
  id: number;
  name: string;
}

const ALL_ROLES: RoleOption[] = [
  { id: 1, name: 'SuperAdmin' },
  { id: 2, name: 'Admin' },
  { id: 3, name: 'User' },
];

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Modifica Utente' : 'Nuovo Utente' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email">
          @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
            <mat-error>Email obbligatoria</mat-error>
          }
          @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
            <mat-error>Email non valida</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Username</mat-label>
          <input matInput formControlName="username">
          @if (form.get('username')?.hasError('required') && form.get('username')?.touched) {
            <mat-error>Username obbligatorio</mat-error>
          }
          @if (form.get('username')?.hasError('minlength') && form.get('username')?.touched) {
            <mat-error>Minimo 3 caratteri</mat-error>
          }
          @if (form.get('username')?.hasError('pattern') && form.get('username')?.touched) {
            <mat-error>Solo lettere, numeri, underscore, punto e trattino</mat-error>
          }
        </mat-form-field>

        @if (!isEdit) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password">
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>Password obbligatoria</mat-error>
            }
            @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
              <mat-error>Minimo 8 caratteri</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Area di login</mat-label>
            <mat-select formControlName="loginArea">
              <mat-option [value]="1">Admin (Backoffice)</mat-option>
              <mat-option [value]="2">App (Frontend)</mat-option>
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Ruoli</mat-label>
          <mat-select formControlName="roleIds" multiple>
            @for (role of roles; track role.id) {
              <mat-option [value]="role.id">{{ role.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('roleIds')?.hasError('required') && form.get('roleIds')?.touched) {
            <mat-error>Almeno un ruolo obbligatorio</mat-error>
          }
        </mat-form-field>

        @if (isEdit) {
          <div class="active-toggle">
            <mat-checkbox formControlName="isActive">Utente attivo</mat-checkbox>
          </div>
        }

        @if (errorMessage()) {
          <p class="error-message">{{ errorMessage() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annulla</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="loading()">
        @if (loading()) {
          <mat-spinner diameter="18" />
        } @else {
          {{ isEdit ? 'Salva' : 'Crea' }}
        }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 4px; min-width: 380px; padding-top: 8px; }
    .full-width { width: 100%; }
    .active-toggle { padding: 4px 0 8px; }
    .error-message { color: #f44336; font-size: 0.875rem; margin: 4px 0; }
    mat-spinner { display: inline-block; }
    mat-dialog-content { max-height: 70vh; }
  `]
})
export class UserDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private dialogRef = inject(MatDialogRef<UserDialogComponent>);

  data: UserDialogData = inject(MAT_DIALOG_DATA);

  roles = ALL_ROLES;
  loading = signal(false);
  errorMessage = signal('');

  get isEdit(): boolean { return !!this.data?.user; }

  form!: FormGroup;

  ngOnInit(): void {
    const user = this.data?.user;

    if (this.isEdit) {
      const currentRoleIds = ALL_ROLES
        .filter(r => user!.roles.includes(r.name))
        .map(r => r.id);

      this.form = this.fb.group({
        email: [user!.email, [Validators.required, Validators.email]],
        username: [user!.username, [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_.\\-]+$/)]],
        roleIds: [currentRoleIds, Validators.required],
        isActive: [user!.isActive],
      });
    } else {
      this.form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        username: ['', [Validators.required, Validators.minLength(3), Validators.pattern(/^[a-zA-Z0-9_.\\-]+$/)]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        loginArea: [1, Validators.required],
        roleIds: [[], Validators.required],
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    const v = this.form.value;

    const call = this.isEdit
      ? this.usersService.update(this.data.user!.id, {
          email: v.email,
          username: v.username,
          isActive: v.isActive,
          roleIds: v.roleIds,
        })
      : this.usersService.create({
          email: v.email,
          username: v.username,
          password: v.password,
          loginArea: v.loginArea,
          roleIds: v.roleIds,
        });

    call.subscribe({
      next: result => { this.loading.set(false); this.dialogRef.close(result); },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.title ?? (this.isEdit ? 'Errore nel salvataggio' : 'Errore nella creazione'));
      }
    });
  }
}
