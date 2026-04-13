import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { MeasureUnitResponse } from '../../../core/models/article.models';

export interface MeasureUnitDialogData {
  unit?: MeasureUnitResponse;
}

@Component({
  selector: 'app-measure-unit-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Modifica Unità di Misura' : 'Nuova Unità di Misura' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" placeholder="Es: PZ, KG, MT">
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Nome obbligatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descrizione (opzionale)</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        @if (errorMessage()) {
          <p class="error-message">{{ errorMessage() }}</p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annulla</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="loading()">
        @if (loading()) { <mat-spinner diameter="18" /> } @else { {{ isEdit ? 'Salva' : 'Crea' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 4px; min-width: 360px; padding-top: 8px; }
    .full-width { width: 100%; }
    .error-message { color: #f44336; font-size: 0.875rem; margin: 4px 0; }
    mat-spinner { display: inline-block; }
  `]
})
export class MeasureUnitDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private measureUnitsService = inject(MeasureUnitsService);
  private dialogRef = inject(MatDialogRef<MeasureUnitDialogComponent>);
  data: MeasureUnitDialogData = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  errorMessage = signal('');
  form!: FormGroup;

  get isEdit(): boolean { return !!this.data?.unit; }

  ngOnInit(): void {
    const u = this.data?.unit;
    this.form = this.fb.group({
      name: [u?.name ?? '', Validators.required],
      description: [u?.description ?? ''],
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');
    const v = this.form.value;

    const call = this.isEdit
      ? this.measureUnitsService.update(this.data.unit!.id, { name: v.name, description: v.description || undefined })
      : this.measureUnitsService.create({ name: v.name, description: v.description || undefined });

    call.subscribe({
      next: result => { this.loading.set(false); this.dialogRef.close(result); },
      error: err => {
        this.loading.set(false);
        this.errorMessage.set(err.error?.title ?? (this.isEdit ? 'Errore nel salvataggio' : 'Errore nella creazione'));
      }
    });
  }
}
