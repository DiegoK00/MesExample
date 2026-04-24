import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryResponse } from '../../../core/models/article.models';
import { CategoryDialogComponent } from './category-dialog.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule, MatDialogModule
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>category</mat-icon> Gestione Categorie</h2>
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon> Nuova Categoria
      </button>
    </div>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else if (categories().length === 0) {
      <div class="no-data">Nessuna categoria trovata</div>
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="categories()">

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let c">{{ c.name }}</td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Descrizione</th>
            <td mat-cell *matCellDef="let c">{{ c.description ?? '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Azioni</th>
            <td mat-cell *matCellDef="let c">
              <button mat-icon-button color="primary" matTooltip="Modifica" (click)="openEditDialog(c)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Elimina" (click)="delete(c)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; padding: 32px; color: #999; }
  `]
})
export class CategoriesComponent implements OnInit {
  private categoriesService = inject(CategoriesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  columns = ['name', 'description', 'actions'];
  loading = signal(false);
  categories = signal<CategoryResponse[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.categoriesService.getAll().subscribe({
      next: res => { this.categories.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Errore nel caricamento', 'OK', { duration: 3000 }); }
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(CategoryDialogComponent, { data: {} });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Categoria creata', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  openEditDialog(category: CategoryResponse): void {
    const ref = this.dialog.open(CategoryDialogComponent, { data: { category } });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Categoria aggiornata', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  delete(category: CategoryResponse): void {
    if (!confirm(`Eliminare la categoria "${category.name}"?`)) return;
    this.categoriesService.delete(category.id).subscribe({
      next: () => { this.snackBar.open('Categoria eliminata', 'OK', { duration: 2000 }); this.load(); },
      error: err => this.snackBar.open(err.error?.title ?? 'Errore nell\'eliminazione', 'OK', { duration: 3000 })
    });
  }
}
