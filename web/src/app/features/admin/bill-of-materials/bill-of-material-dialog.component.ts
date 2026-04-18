import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';
import { BillOfMaterialsService } from '../../../core/services/bill-of-materials.service';
import { ArticlesService } from '../../../core/services/articles.service';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { ArticleResponse, MeasureUnitResponse, BillOfMaterialResponse } from '../../../core/models/article.models';

interface DialogData {
  parentArticleId: number;
  bom?: BillOfMaterialResponse;
}

@Component({
  selector: 'app-bill-of-material-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatProgressSpinnerModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.bom ? 'Modifica Componente' : 'Aggiungi Componente' }}</h2>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else {
      <mat-dialog-content>
        <form [formGroup]="form">

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Articolo Componente</mat-label>
            <mat-select formControlName="componentArticleId" [disabled]="!!data.bom">
              @for (article of articles(); track article.id) {
                <mat-option [value]="article.id">
                  {{ article.code }} - {{ article.name }}
                </mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Quantità</mat-label>
            <input matInput type="number" step="0.0001" formControlName="quantity" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tipo Quantità</mat-label>
            <mat-select formControlName="quantityType">
              <mat-option value="PHYSICAL">Fisico</mat-option>
              <mat-option value="PERCENTAGE">Percentuale</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Unità di Misura</mat-label>
            <mat-select formControlName="umId">
              @for (um of units(); track um.id) {
                <mat-option [value]="um.id">{{ um.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <h3>Gestione Scarto</h3>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Scarto Percentuale (%)</mat-label>
            <input matInput type="number" step="0.01" formControlName="scrapPercentage" />
            <mat-hint>Es: 5.00 per il 5%</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Scarto Fattore</mat-label>
            <input matInput type="number" step="0.0001" formControlName="scrapFactor" />
            <mat-hint>Es: 0.05 per il 5%</mat-hint>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Scarto Fisso</mat-label>
            <input matInput type="number" step="0.0001" formControlName="fixedScrap" />
            <mat-hint>Quantità fissa scartata (es: 0.5 kg)</mat-hint>
          </mat-form-field>

          @if (errorMsg()) {
            <div class="error-message">{{ errorMsg() }}</div>
          }
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">Annulla</button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Salvataggio...' : (data.bom ? 'Aggiorna' : 'Crea') }}
        </button>
      </mat-dialog-actions>
    }
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 16px; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    h3 { margin-top: 24px; margin-bottom: 12px; font-size: 0.95rem; font-weight: 600; }
    .error-message { color: #d32f2f; font-size: 0.85rem; margin-top: 16px; }
    mat-dialog-actions { padding: 16px 0 0 0; }
  `]
})
export class BillOfMaterialDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private bomService = inject(BillOfMaterialsService);
  private articlesService = inject(ArticlesService);
  private unitsService = inject(MeasureUnitsService);
  dialogRef = inject(MatDialogRef<BillOfMaterialDialogComponent>);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  form!: FormGroup;
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  articles = signal<ArticleResponse[]>([]);
  units = signal<MeasureUnitResponse[]>([]);

  ngOnInit(): void {
    this.loadSelectData();
    this.initForm();
  }

  private loadSelectData(): void {
    this.loading.set(true);
    forkJoin([
      this.articlesService.getAll(),
      this.unitsService.getAll()
    ]).subscribe({
      next: ([articles, units]) => {
        // Escludi l'articolo padre dalla lista componenti
        this.articles.set(articles.filter(a => a.id !== this.data.parentArticleId));
        this.units.set(units);
        this.loading.set(false);
      }
    });
  }

  private initForm(): void {
    const initialValues = this.data.bom
      ? {
          componentArticleId: this.data.bom.componentArticleId,
          quantity: this.data.bom.quantity,
          quantityType: this.data.bom.quantityType,
          umId: this.data.bom.umId,
          scrapPercentage: this.data.bom.scrapPercentage,
          scrapFactor: this.data.bom.scrapFactor,
          fixedScrap: this.data.bom.fixedScrap
        }
      : {
          componentArticleId: null,
          quantity: 1,
          quantityType: 'PHYSICAL',
          umId: null,
          scrapPercentage: 0,
          scrapFactor: 0,
          fixedScrap: 0
        };

    this.form = this.fb.group({
      componentArticleId: [initialValues.componentArticleId, Validators.required],
      quantity: [initialValues.quantity, [Validators.required, Validators.min(0.0001)]],
      quantityType: [initialValues.quantityType, Validators.required],
      umId: [initialValues.umId, Validators.required],
      scrapPercentage: [initialValues.scrapPercentage, [Validators.min(0), Validators.max(100)]],
      scrapFactor: [initialValues.scrapFactor, [Validators.min(0), Validators.max(1)]],
      fixedScrap: [initialValues.fixedScrap, Validators.min(0)]
    });

    if (this.data.bom) {
      this.form.get('componentArticleId')?.disable();
    }
  }

  save(): void {
    if (this.form.invalid) return;

    this.saving.set(true);
    this.errorMsg.set(null);

    const request = this.form.value;

    const call$ = this.data.bom
      ? this.bomService.update(this.data.parentArticleId, this.data.bom.componentArticleId, request)
      : this.bomService.create({ parentArticleId: this.data.parentArticleId, ...request });

    call$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: err => {
        this.saving.set(false);
        this.errorMsg.set(err.error?.title ?? 'Errore nel salvataggio');
      }
    });
  }
}
