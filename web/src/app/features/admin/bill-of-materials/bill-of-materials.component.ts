import { Component, OnInit, signal, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { BillOfMaterialsService } from '../../../core/services/bill-of-materials.service';
import { ArticlesService } from '../../../core/services/articles.service';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { BillOfMaterialResponse, ArticleResponse, MeasureUnitResponse } from '../../../core/models/article.models';
import { BillOfMaterialDialogComponent } from './bill-of-material-dialog.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-bill-of-materials',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule, MatDialogModule, MatChipsModule
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>build</mat-icon> Bill of Materials - {{ parentArticle()?.code }}</h2>
      <div class="header-actions">
        <button mat-stroked-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon> Indietro
        </button>
        <button mat-raised-button color="primary" (click)="openCreateDialog()" [disabled]="loading()">
          <mat-icon>add</mat-icon> Aggiungi Componente
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="boms()">

          <ng-container matColumnDef="componentCode">
            <th mat-header-cell *matHeaderCellDef>Codice Componente</th>
            <td mat-cell *matCellDef="let b"><code>{{ b.componentArticleCode }}</code></td>
          </ng-container>

          <ng-container matColumnDef="componentName">
            <th mat-header-cell *matHeaderCellDef>Nome Componente</th>
            <td mat-cell *matCellDef="let b">{{ b.componentArticleName }}</td>
          </ng-container>

          <ng-container matColumnDef="quantity">
            <th mat-header-cell *matHeaderCellDef>Quantità</th>
            <td mat-cell *matCellDef="let b">
              {{ b.quantity | number: '1.4-4' }}
              <mat-chip [highlighted]="b.quantityType === 'PERCENTAGE'">{{ b.quantityType }}</mat-chip>
              <mat-chip>{{ b.umName }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="scrap">
            <th mat-header-cell *matHeaderCellDef>Scarto</th>
            <td mat-cell *matCellDef="let b">
              @if (b.scrapPercentage > 0) { <span>{{ b.scrapPercentage }}%</span> }
              @if (b.scrapFactor > 0) { <span>F:{{ b.scrapFactor | number: '1.4-4' }}</span> }
              @if (b.fixedScrap > 0) { <span>Fix:{{ b.fixedScrap | number: '1.4-4' }}</span> }
              @if (!b.scrapPercentage && !b.scrapFactor && !b.fixedScrap) { <span>—</span> }
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Azioni</th>
            <td mat-cell *matCellDef="let b">
              <button mat-icon-button color="primary" matTooltip="Modifica" (click)="openEditDialog(b)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Elimina" (click)="delete(b)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data" [attr.colspan]="columns.length">Nessun componente trovato</td>
          </tr>
        </table>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 12px; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; padding: 32px; color: #999; }
    mat-chip { margin: 0 4px; }
  `]
})
export class BillOfMaterialsComponent implements OnInit {
  private bomService = inject(BillOfMaterialsService);
  private articlesService = inject(ArticlesService);
  private unitsService = inject(MeasureUnitsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  parentArticleId = input.required<number>();
  parentArticle = signal<ArticleResponse | null>(null);
  columns = ['componentCode', 'componentName', 'quantity', 'scrap', 'actions'];
  loading = signal(false);
  boms = signal<BillOfMaterialResponse[]>([]);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    forkJoin([
      this.articlesService.getById(this.parentArticleId()),
      this.bomService.getByParentArticle(this.parentArticleId())
    ]).subscribe({
      next: ([article, boms]) => {
        this.parentArticle.set(article);
        this.boms.set(boms);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Errore nel caricamento', 'OK', { duration: 3000 });
      }
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(BillOfMaterialDialogComponent, {
      width: '600px',
      data: { parentArticleId: this.parentArticleId() }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Componente aggiunto', 'OK', { duration: 2000 });
        this.loadData();
      }
    });
  }

  openEditDialog(bom: BillOfMaterialResponse): void {
    const ref = this.dialog.open(BillOfMaterialDialogComponent, {
      width: '600px',
      data: { parentArticleId: this.parentArticleId(), bom }
    });
    ref.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Componente aggiornato', 'OK', { duration: 2000 });
        this.loadData();
      }
    });
  }

  delete(bom: BillOfMaterialResponse): void {
    if (!confirm(`Eliminare il componente "${bom.componentArticleName}" da questo articolo?`)) return;
    this.bomService.delete(bom.parentArticleId, bom.componentArticleId).subscribe({
      next: () => {
        this.snackBar.open('Componente eliminato', 'OK', { duration: 2000 });
        this.loadData();
      },
      error: err => this.snackBar.open(err.error?.title ?? 'Errore nell\'eliminazione', 'OK', { duration: 3000 })
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/articles']);
  }
}
