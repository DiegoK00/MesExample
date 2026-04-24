import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { MeasureUnitResponse } from '../../../core/models/article.models';
import { MeasureUnitDialogComponent } from './measure-unit-dialog.component';

@Component({
  selector: 'app-measure-units',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule, MatDialogModule
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>straighten</mat-icon> Unità di Misura</h2>
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>add</mat-icon> Nuova UM
      </button>
    </div>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else if (units().length === 0) {
      <div class="no-data">Nessuna unità di misura trovata</div>
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="units()">

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let u"><code>{{ u.name }}</code></td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Descrizione</th>
            <td mat-cell *matCellDef="let u">{{ u.description ?? '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Azioni</th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button color="primary" matTooltip="Modifica" (click)="openEditDialog(u)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Elimina" (click)="delete(u)">
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
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; padding: 32px; color: #999; }
  `]
})
export class MeasureUnitsComponent implements OnInit {
  private measureUnitsService = inject(MeasureUnitsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  columns = ['name', 'description', 'actions'];
  loading = signal(false);
  units = signal<MeasureUnitResponse[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.measureUnitsService.getAll().subscribe({
      next: res => { this.units.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Errore nel caricamento', 'OK', { duration: 3000 }); }
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(MeasureUnitDialogComponent, { data: {} });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Unità di misura creata', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  openEditDialog(unit: MeasureUnitResponse): void {
    const ref = this.dialog.open(MeasureUnitDialogComponent, { data: { unit } });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Unità di misura aggiornata', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  delete(unit: MeasureUnitResponse): void {
    if (!confirm(`Eliminare l'unità di misura "${unit.name}"?`)) return;
    this.measureUnitsService.delete(unit.id).subscribe({
      next: () => { this.snackBar.open('Unità di misura eliminata', 'OK', { duration: 2000 }); this.load(); },
      error: err => this.snackBar.open(err.error?.title ?? 'Errore nell\'eliminazione', 'OK', { duration: 3000 })
    });
  }
}
