import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { ArticlesService } from '../../../core/services/articles.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { ArticleResponse, CategoryResponse, MeasureUnitResponse } from '../../../core/models/article.models';

export interface ArticleDialogData {
  article?: ArticleResponse;
}

@Component({
  selector: 'app-article-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatSelectModule, MatCheckboxModule, MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Modifica Articolo' : 'Nuovo Articolo' }}</h2>

    <mat-dialog-content>
      @if (loadingData()) {
        <div class="spinner-center"><mat-spinner diameter="36" /></div>
      } @else {
        <form [formGroup]="form" class="form">

          @if (!isEdit) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Codice</mat-label>
              <input matInput formControlName="code" placeholder="Es: ART001">
              @if (form.get('code')?.hasError('required') && form.get('code')?.touched) {
                <mat-error>Codice obbligatorio</mat-error>
              }
            </mat-form-field>
          } @else {
            <div class="code-readonly">
              <span class="code-label">Codice</span>
              <code>{{ data.article!.code }}</code>
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
            <textarea matInput formControlName="description" rows="2"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Categoria</mat-label>
            <mat-select formControlName="categoryId">
              @for (cat of categories(); track cat.id) {
                <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
              }
            </mat-select>
            @if (form.get('categoryId')?.hasError('required') && form.get('categoryId')?.touched) {
              <mat-error>Categoria obbligatoria</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Prezzo (€)</mat-label>
            <input matInput type="number" formControlName="price" min="0" step="0.01">
            @if (form.get('price')?.hasError('required') && form.get('price')?.touched) {
              <mat-error>Prezzo obbligatorio</mat-error>
            }
          </mat-form-field>

          <div class="row-2col">
            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>UM</mat-label>
              <mat-select formControlName="umId">
                @for (um of measureUnits(); track um.id) {
                  <mat-option [value]="um.id">{{ um.name }}</mat-option>
                }
              </mat-select>
              @if (form.get('umId')?.hasError('required') && form.get('umId')?.touched) {
                <mat-error>UM obbligatoria</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="flex-1">
              <mat-label>UM2 (opzionale)</mat-label>
              <mat-select formControlName="um2Id">
                <mat-option [value]="null">—</mat-option>
                @for (um of measureUnits(); track um.id) {
                  <mat-option [value]="um.id">{{ um.name }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Misure (opzionale)</mat-label>
            <input matInput formControlName="measures" placeholder="Es: S / M / L / XL">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Composizione (opzionale)</mat-label>
            <textarea matInput formControlName="composition" rows="2"
              placeholder="Es: Cotton 70% Elastane 30%"></textarea>
          </mat-form-field>

          @if (isEdit) {
            <div class="active-toggle">
              <mat-checkbox formControlName="isActive">Articolo attivo</mat-checkbox>
            </div>
          }

          @if (errorMessage()) {
            <p class="error-message">{{ errorMessage() }}</p>
          }
        </form>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annulla</button>
      <button mat-raised-button color="primary" (click)="submit()" [disabled]="loading() || loadingData()">
        @if (loading()) { <mat-spinner diameter="18" /> } @else { {{ isEdit ? 'Salva' : 'Crea' }} }
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form { display: flex; flex-direction: column; gap: 4px; min-width: 420px; padding-top: 8px; }
    .full-width { width: 100%; }
    .row-2col { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .active-toggle { padding: 4px 0 8px; }
    .code-readonly { display: flex; align-items: center; gap: 12px; padding: 8px 0 12px; }
    .code-label { font-size: 0.875rem; color: #666; }
    code { background: #f0f0f0; padding: 4px 10px; border-radius: 4px; font-size: 0.9rem; }
    .error-message { color: #f44336; font-size: 0.875rem; margin: 4px 0; }
    .spinner-center { display: flex; justify-content: center; padding: 32px; min-width: 420px; }
    mat-spinner { display: inline-block; }
  `]
})
export class ArticleDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private articlesService = inject(ArticlesService);
  private categoriesService = inject(CategoriesService);
  private measureUnitsService = inject(MeasureUnitsService);
  private dialogRef = inject(MatDialogRef<ArticleDialogComponent>);
  data: ArticleDialogData = inject(MAT_DIALOG_DATA);

  loading = signal(false);
  loadingData = signal(true);
  errorMessage = signal('');
  categories = signal<CategoryResponse[]>([]);
  measureUnits = signal<MeasureUnitResponse[]>([]);
  form!: FormGroup;

  get isEdit(): boolean { return !!this.data?.article; }

  ngOnInit(): void {
    const a = this.data?.article;

    if (this.isEdit) {
      this.form = this.fb.group({
        name: [a!.name, Validators.required],
        description: [a!.description ?? ''],
        categoryId: [a!.categoryId, Validators.required],
        price: [a!.price, [Validators.required, Validators.min(0)]],
        umId: [a!.umId, Validators.required],
        um2Id: [a!.um2Id ?? null],
        measures: [a!.measures ?? ''],
        composition: [a!.composition ?? ''],
        isActive: [a!.isActive],
      });
    } else {
      this.form = this.fb.group({
        code: ['', Validators.required],
        name: ['', Validators.required],
        description: [''],
        categoryId: [null, Validators.required],
        price: [0, [Validators.required, Validators.min(0)]],
        umId: [null, Validators.required],
        um2Id: [null],
        measures: [''],
        composition: [''],
      });
    }

    forkJoin({
      categories: this.categoriesService.getAll(),
      units: this.measureUnitsService.getAll()
    }).subscribe({
      next: ({ categories, units }) => {
        this.categories.set(categories);
        this.measureUnits.set(units);
        this.loadingData.set(false);
      },
      error: () => {
        this.loadingData.set(false);
        this.errorMessage.set('Errore nel caricamento dei dati di supporto');
      }
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMessage.set('');
    const v = this.form.value;

    const call = this.isEdit
      ? this.articlesService.update(this.data.article!.id, {
          name: v.name,
          description: v.description || undefined,
          categoryId: v.categoryId,
          price: v.price,
          umId: v.umId,
          um2Id: v.um2Id ?? undefined,
          measures: v.measures || undefined,
          composition: v.composition || undefined,
          isActive: v.isActive,
        })
      : this.articlesService.create({
          code: v.code,
          name: v.name,
          description: v.description || undefined,
          categoryId: v.categoryId,
          price: v.price,
          umId: v.umId,
          um2Id: v.um2Id ?? undefined,
          measures: v.measures || undefined,
          composition: v.composition || undefined,
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
