import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ProgramsService } from '../../../core/services/programs.service';
import { ProgramResponse } from '../../../core/models/program.models';
import { ProgramDialogComponent } from './program-dialog.component';

@Component({
  selector: 'app-programs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatChipsModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSlideToggleModule, MatDialogModule
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>apps</mat-icon> Gestione Programmi</h2>
      <div class="header-actions">
        <mat-slide-toggle [(ngModel)]="activeOnly" (change)="load()">Solo attivi</mat-slide-toggle>
        <button mat-raised-button color="primary" (click)="openCreateDialog()">
          <mat-icon>add</mat-icon> Nuovo Programma
        </button>
      </div>
    </div>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else if (programs().length === 0) {
      <div class="no-data">Nessun programma trovato</div>
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="programs()">

          <ng-container matColumnDef="code">
            <th mat-header-cell *matHeaderCellDef>Codice</th>
            <td mat-cell *matCellDef="let p"><code>{{ p.code }}</code></td>
          </ng-container>

          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let p">{{ p.name }}</td>
          </ng-container>

          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef>Descrizione</th>
            <td mat-cell *matCellDef="let p">{{ p.description ?? '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Stato</th>
            <td mat-cell *matCellDef="let p">
              <mat-chip [color]="p.isActive ? 'primary' : 'warn'" highlighted>
                {{ p.isActive ? 'Attivo' : 'Disattivo' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Azioni</th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="primary" matTooltip="Modifica" (click)="openEditDialog(p)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" matTooltip="Elimina" (click)="delete(p)">
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
    .header-actions { display: flex; align-items: center; gap: 16px; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 0.85rem; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; padding: 32px; color: #999; }
  `]
})
export class ProgramsComponent implements OnInit {
  private programsService = inject(ProgramsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  columns = ['code', 'name', 'description', 'status', 'actions'];
  loading = signal(false);
  programs = signal<ProgramResponse[]>([]);
  activeOnly = false;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.programsService.getAll(this.activeOnly || undefined).subscribe({
      next: res => { this.programs.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Errore nel caricamento', 'OK', { duration: 3000 }); }
    });
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(ProgramDialogComponent, { data: {} });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Programma creato', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  openEditDialog(program: ProgramResponse): void {
    const ref = this.dialog.open(ProgramDialogComponent, { data: { program } });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Programma aggiornato', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  delete(program: ProgramResponse): void {
    if (!confirm(`Eliminare il programma ${program.code}?`)) return;
    this.programsService.delete(program.id).subscribe({
      next: () => { this.snackBar.open('Programma eliminato', 'OK', { duration: 2000 }); this.load(); },
      error: (err) => this.snackBar.open(err.error?.title ?? 'Errore nell\'eliminazione', 'OK', { duration: 3000 })
    });
  }
}
