import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { UsersService } from '../../../core/services/users.service';
import { ProgramsService } from '../../../core/services/programs.service';
import { UserProgramResponse, ProgramResponse } from '../../../core/models/program.models';

export interface UserProgramsDialogData {
  userId: number;
  username: string;
}

@Component({
  selector: 'app-user-programs-dialog',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule,
    MatListModule, MatProgressSpinnerModule, MatDividerModule,
    MatChipsModule, MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>apps</mat-icon>
      Programmi di {{ data.username }}
    </h2>

    <mat-dialog-content>
      @if (loading()) {
        <div class="spinner-center"><mat-spinner diameter="36" /></div>
      } @else {
        <div class="columns">

          <!-- Assegnati -->
          <div class="col">
            <p class="col-title">
              <mat-icon>check_circle</mat-icon>
              Assegnati ({{ assigned().length }})
            </p>
            @if (assigned().length === 0) {
              <p class="empty">Nessun programma assegnato</p>
            }
            <mat-list>
              @for (p of assigned(); track p.programId) {
                <mat-list-item>
                  <span matListItemTitle>{{ p.code }}</span>
                  <span matListItemLine>{{ p.name }}</span>
                  <button mat-icon-button matListItemMeta color="warn"
                    matTooltip="Revoca" (click)="revoke(p.programId)"
                    [disabled]="busy()">
                    <mat-icon>remove_circle_outline</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          </div>

          <mat-divider [vertical]="true" />

          <!-- Disponibili -->
          <div class="col">
            <p class="col-title">
              <mat-icon>add_circle_outline</mat-icon>
              Disponibili ({{ available().length }})
            </p>
            @if (available().length === 0) {
              <p class="empty">Tutti i programmi sono già assegnati</p>
            }
            <mat-list>
              @for (p of available(); track p.id) {
                <mat-list-item>
                  <span matListItemTitle>{{ p.code }}</span>
                  <span matListItemLine>{{ p.name }}</span>
                  <button mat-icon-button matListItemMeta color="primary"
                    matTooltip="Assegna" (click)="assign(p.id)"
                    [disabled]="busy()">
                    <mat-icon>add_circle_outline</mat-icon>
                  </button>
                </mat-list-item>
              }
            </mat-list>
          </div>

        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Chiudi</button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display: flex; align-items: center; gap: 8px; }
    mat-dialog-content { min-width: 560px; max-height: 60vh; }
    .spinner-center { display: flex; justify-content: center; padding: 32px; }
    .columns { display: flex; gap: 0; }
    .col { flex: 1; padding: 0 16px; }
    .col-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #444; margin: 0 0 8px; }
    .empty { color: #999; font-size: 0.85rem; padding: 8px 0; }
    mat-divider { margin: 0 8px; }
  `]
})
export class UserProgramsDialogComponent implements OnInit {
  private usersService = inject(UsersService);
  private programsService = inject(ProgramsService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<UserProgramsDialogComponent>);

  data: UserProgramsDialogData = inject(MAT_DIALOG_DATA);

  loading = signal(true);
  busy = signal(false);
  assigned = signal<UserProgramResponse[]>([]);
  allPrograms = signal<ProgramResponse[]>([]);

  available = () => this.allPrograms().filter(
    p => p.isActive && !this.assigned().some(a => a.programId === p.id)
  );

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    forkJoin({
      assigned: this.usersService.getUserPrograms(this.data.userId),
      all: this.programsService.getAll()
    }).subscribe({
      next: ({ assigned, all }) => {
        this.assigned.set(assigned);
        this.allPrograms.set(all);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Errore nel caricamento programmi', 'OK', { duration: 3000 });
      }
    });
  }

  assign(programId: number): void {
    this.busy.set(true);
    this.usersService.assignPrograms(this.data.userId, [programId]).subscribe({
      next: updated => {
        this.assigned.set(updated);
        this.busy.set(false);
        this.snackBar.open('Programma assegnato', 'OK', { duration: 2000 });
      },
      error: () => {
        this.busy.set(false);
        this.snackBar.open('Errore nell\'assegnazione', 'OK', { duration: 3000 });
      }
    });
  }

  revoke(programId: number): void {
    this.busy.set(true);
    this.usersService.revokePrograms(this.data.userId, [programId]).subscribe({
      next: () => {
        this.assigned.update(list => list.filter(p => p.programId !== programId));
        this.busy.set(false);
        this.snackBar.open('Programma revocato', 'OK', { duration: 2000 });
      },
      error: () => {
        this.busy.set(false);
        this.snackBar.open('Errore nella revoca', 'OK', { duration: 3000 });
      }
    });
  }
}
