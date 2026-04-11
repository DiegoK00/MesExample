import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UsersService } from '../../../core/services/users.service';
import { UserResponse, UsersPageResponse } from '../../../core/models/user.models';
import { UserDialogComponent } from './user-dialog.component';
import { UserProgramsDialogComponent } from './user-programs-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatPaginatorModule, MatChipsModule,
    MatDialogModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatTooltipModule, MatBadgeModule, MatSlideToggleModule
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>people</mat-icon> Gestione Utenti</h2>
      <button mat-raised-button color="primary" (click)="openCreateDialog()">
        <mat-icon>person_add</mat-icon> Nuovo Utente
      </button>
    </div>

    <div class="search-bar">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Cerca per email o username</mat-label>
        <input matInput [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Cerca...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      <button mat-stroked-button (click)="search()">Cerca</button>
      <button mat-stroked-button (click)="clearSearch()" *ngIf="searchTerm">
        <mat-icon>clear</mat-icon>
      </button>
    </div>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="data()?.items ?? []">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let u">{{ u.id }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>

          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Username</th>
            <td mat-cell *matCellDef="let u">{{ u.username }}</td>
          </ng-container>

          <ng-container matColumnDef="area">
            <th mat-header-cell *matHeaderCellDef>Area</th>
            <td mat-cell *matCellDef="let u">
              <mat-chip [color]="u.loginArea === 1 ? 'primary' : 'accent'" highlighted>
                {{ u.loginArea === 1 ? 'Admin' : 'App' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="roles">
            <th mat-header-cell *matHeaderCellDef>Ruoli</th>
            <td mat-cell *matCellDef="let u">
              <mat-chip-set>
                @for (role of u.roles; track role) {
                  <mat-chip>{{ role }}</mat-chip>
                }
              </mat-chip-set>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Stato</th>
            <td mat-cell *matCellDef="let u">
              <mat-chip [color]="u.isActive ? 'primary' : 'warn'" highlighted>
                {{ u.isActive ? 'Attivo' : 'Disattivo' }}
              </mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Azioni</th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button color="primary" matTooltip="Modifica" (click)="openEditDialog(u)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="accent" matTooltip="Gestisci programmi" (click)="openProgramsDialog(u)">
                <mat-icon>apps</mat-icon>
              </button>
              @if (u.isActive) {
                <button mat-icon-button color="warn" matTooltip="Disattiva" (click)="deactivate(u)">
                  <mat-icon>person_off</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell no-data" [attr.colspan]="columns.length">Nessun utente trovato</td>
          </tr>
        </table>

        <mat-paginator
          [length]="data()?.totalCount ?? 0"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)" />
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .search-bar { display: flex; gap: 8px; align-items: center; margin-bottom: 16px; }
    .search-field { flex: 1; max-width: 400px; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    .no-data { text-align: center; padding: 32px; color: #999; }
  `]
})
export class UsersComponent implements OnInit {
  private usersService = inject(UsersService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  columns = ['id', 'email', 'username', 'area', 'roles', 'status', 'actions'];
  loading = signal(false);
  data = signal<UsersPageResponse | null>(null);
  searchTerm = '';
  page = 1;
  pageSize = 20;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.usersService.getAll(this.page, this.pageSize, this.searchTerm || undefined).subscribe({
      next: res => { this.data.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Errore nel caricamento utenti', 'OK', { duration: 3000 }); }
    });
  }

  search(): void { this.page = 1; this.load(); }
  clearSearch(): void { this.searchTerm = ''; this.search(); }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(UserDialogComponent, { data: {} });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Utente creato', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  openProgramsDialog(user: UserResponse): void {
    this.dialog.open(UserProgramsDialogComponent, {
      data: { userId: user.id, username: user.username }
    });
  }

  openEditDialog(user: UserResponse): void {
    const ref = this.dialog.open(UserDialogComponent, { data: { user } });
    ref.afterClosed().subscribe(result => {
      if (result) { this.snackBar.open('Utente aggiornato', 'OK', { duration: 2000 }); this.load(); }
    });
  }

  deactivate(user: UserResponse): void {
    if (!confirm(`Disattivare l'utente ${user.username}?`)) return;
    this.usersService.deactivate(user.id).subscribe({
      next: () => { this.snackBar.open('Utente disattivato', 'OK', { duration: 2000 }); this.load(); },
      error: () => this.snackBar.open('Errore nella disattivazione', 'OK', { duration: 3000 })
    });
  }
}
