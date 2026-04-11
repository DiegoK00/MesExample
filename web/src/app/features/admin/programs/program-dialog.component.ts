import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProgramsService } from '../../../core/services/programs.service';
import { ProgramResponse } from '../../../core/models/program.models';

export interface ProgramDialogData {
  program?: ProgramResponse;
}

@Component({
  selector: 'app-program-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Modifica Programma' : 'Nuovo Programma' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">

        @if (!isEdit) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Codice</mat-label>
            <input matInput formControlName="code" placeholder="ES: GESTIONE_ORDINI"
              (input)="uppercaseCode($event)">
            <mat-hint>Solo lettere maiuscole, numeri e underscore</mat-hint>
            @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
              <mat-error>Codice obbligatorio</mat-error>
            }
            @if (form.get('code')?.hasError('pattern') && form.get('code')?.touched) {
              <mat-error>Solo [A-Z0-9_] consentiti</mat-error>
            }
          </mat-form-field>
        } @else {
          <div class="code-readonly">
            <span class="code-label">Codice</span>
            <code>{{ data.program!.code }}</code>
          </div>
        }

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Nome obbligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descrizione (opzionale)</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        @if (isEdit) {
          <div class="active-toggle">
            <mat-checkbox formControlName="isActive">Programma attivo</mat-checkbox>
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
    .code-readonly { display: flex; align-items: center; gap: 12px; padding: 8px 0 12px; }
    .code-label { font-size: 0.875rem; color: #666; }
    code { background: #f0f0f0; padding: 4px 10px; border-radius: 4px; font-size: 0.9rem; }
    .error-message { color: #f44336; font-size: 0.875rem; margin: 4px 0; }
    mat-spinner { display: inline-block; }
  `]
})
export class ProgramDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private programsService = inject(ProgramsService);
  private dialogRef = inject(MatDialogRef<ProgramDialogComponent>);

  data: ProgramDialogData = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  errorMessage = signal('');

  get isEdit(): boolean { return !!this.data?.program; }

  form!: FormGroup;

  ngOnInit(): void {
    const p = this.data?.program;

    if (this.isEdit) {
      this.form = this.fb.group({
        name: [p!.name, Validators.required],
        description: [p!.description ?? ''],
        isActive: [p!.isActive],
      });
    } else {
      this.form = this.fb.group({
        code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9_]+$/)]],
        name: ['', Validators.required],
        description: [''],
      });
    }
  }

  uppercaseCode(event: Event): void {
    const input = event.target as HTMLInputElement;
    const upper = input.value.toUpperCase();
    this.form.get('code')!.setValue(upper, { emitEvent: false });
    input.value = upper;
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    const v = this.form.value;

    const call = this.isEdit
      ? this.programsService.update(this.data.program!.id, {
          name: v.name,
          description: v.description || undefined,
          isActive: v.isActive,
        })
      : this.programsService.create({
          code: v.code,
          name: v.name,
          description: v.description || undefined,
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
