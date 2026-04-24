import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ArticlesService } from '../../../core/services/articles.service';
import { ArticleResponse } from '../../../core/models/article.models';
import { ArticleDialogComponent } from './article-dialog.component';

@Component({
  selector: 'app-articles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule,
    MatSlideToggleModule, MatDialogModule
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>inventory_2</mat-icon> Gestione Articoli</h2>
      <div class="header-actions">
        <mat-slide-toggle [(ngModel)]="activeOnly" (change)="load()">Solo attivi</mat-slide-toggle>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon> Nuovo Articolo
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else if (articles().length === 0) {
      <div class="no-data">Nessun articolo trovato</div>
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="articles()">

          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Codice</th>
            <td mat-cell *matCellDef="let a"><code>{{ a.code }}</code></td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let a">{{ a.name }}</td>
          </ng-container>

          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Categoria</th>
            <td mat-cell *matCellDef="let a">{{ a.categoryName }}</td>
          </ng-container>

          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Prezzo</th>
            <td mat-cell *matCellDef="let a">{{ a.price | currency:'EUR':'symbol':'1.2-2' }}</td>
          </ng-container>

          <ng-container matColumnDef="um">
            <th mat-header-cell *matHeaderCellDef>UM</th>
            <td mat-cell *matCellDef="let a">
              <code>{{ a.umName }}</code>
              @if (a.um2Name) { <span class="um2"> / {{ a.um2Name }}</span> }
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Stato</th>
            <td mat-cell *matCellDef="let a">
              <mat-chip [color]="a.isActive ? 'primary' : 'warn'" highlighted>
                {{ a.isActive ? 'Attivo' : 'Disattivo' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Azioni</th>
            <td mat-cell *matCellDef="let a">
              <button mat-icon-button color="accent" matTooltip="Bill of Materials" (click)="viewBOM(a)">
                <mat-icon>build</mat-icon>
              </button>
              <button mat-icon-button color="primary" matTooltip="Modifica" (click)="openEditDialog(a)">
                <mat-icon>edit</mat-icon>
              </button>
              @if (a.isActive) {
                <button mat-icon-button color="warn" matTooltip="Disattiva" (click)="delete(a)">
                  <mat-icon>delete</mat-icon>
                </button>
              }
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
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .um2 { color: #666; font-size: 0.85rem; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; padding: 32px; color: #999; }
  `]
})
export class ArticlesComponent implements OnInit {
  private articlesService = inject(ArticlesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private router = inject(Router);

  columns = ['code', 'name', 'category', 'price', 'um', 'status', 'actions'];
  loading = signal(false);
  articles = signal<ArticleResponse[]>([]);
  activeOnly = false;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.articlesService.getAll(this.activeOnly || undefined).subscribe({
      next: res => { this.articles.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Errore nel caricamento', 'OK', { duration: 3000 }); }
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ArticleDialogComponent, { data: {} });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Articolo creato', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  openEditDialog(article: ArticleResponse): void {
    const ref = this.dialog.open(ArticleDialogComponent, { data: { article } });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Articolo aggiornato', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  delete(article: ArticleResponse): void {
    if (!confirm(`Disattivare l'articolo "${article.name}"?`)) return;
    this.articlesService.delete(article.id).subscribe({
      next: () => { this.snackBar.open('Articolo disattivato', 'OK', { duration: 2000 }); this.load(); },
      error: err => this.snackBar.open(err.error?.title ?? 'Errore nella disattivazione', 'OK', { duration: 3000 })
    });
  }

  viewBOM(article: ArticleResponse): void {
    this.router.navigate(['/admin/articles', article.id, 'bom']);
  }
}
