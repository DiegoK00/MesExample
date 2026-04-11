import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { AuditLogsService } from '../../../core/services/audit-logs.service';
import { AuditLogsPageResponse } from '../../../core/models/audit-log.models';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatPaginatorModule, MatSelectModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule, MatChipsModule
  ],
  template: `
    <div class="page-header">
      <h2><mat-icon>history</mat-icon> Audit Log</h2>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline">
        <mat-label>Azione</mat-label>
        <mat-select [(ngModel)]="filterAction" (selectionChange)="load()">
          <mat-option value="">Tutte</mat-option>
          @for (a of actions; track a) {
            <mat-option [value]="a">{{ a }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Entità</mat-label>
        <mat-select [(ngModel)]="filterEntity" (selectionChange)="load()">
          <mat-option value="">Tutte</mat-option>
          <mat-option value="User">User</mat-option>
          <mat-option value="Program">Program</mat-option>
          <mat-option value="UserProgram">UserProgram</mat-option>
        </mat-select>
      </mat-form-field>

      <button mat-stroked-button (click)="clearFilters()">
        <mat-icon>filter_alt_off</mat-icon> Reset
      </button>
    </div>

    @if (loading()) {
      <div class="spinner-center"><mat-spinner /></div>
    } @else {
      <div class="table-container mat-elevation-z2">
        <table mat-table [dataSource]="data()?.items ?? []">

          <ng-container matColumnDef="timestamp">
            <th mat-header-cell *matHeaderCellDef>Timestamp</th>
            <td mat-cell *matCellDef="let l">{{ l.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</td>
          </ng-container>

          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Utente</th>
            <td mat-cell *matCellDef="let l">{{ l.username ?? '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="action">
            <th mat-header-cell *matHeaderCellDef>Azione</th>
            <td mat-cell *matCellDef="let l">
              <mat-chip [color]="getActionColor(l.action)" highlighted>{{ l.action }}</mat-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="entity">
            <th mat-header-cell *matHeaderCellDef>Entità</th>
            <td mat-cell *matCellDef="let l">{{ l.entityName ?? '—' }} {{ l.entityId ? '#' + l.entityId : '' }}</td>
          </ng-container>

          <ng-container matColumnDef="ip">
            <th mat-header-cell *matHeaderCellDef>IP</th>
            <td mat-cell *matCellDef="let l">{{ l.ipAddress ?? '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="details">
            <th mat-header-cell *matHeaderCellDef>Dettagli</th>
            <td mat-cell *matCellDef="let l">
              @if (l.newValues) {
                <span class="detail-text" [matTooltip]="l.newValues">{{ l.newValues | slice:0:40 }}{{ l.newValues.length > 40 ? '...' : '' }}</span>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        <mat-paginator
          [length]="data()?.totalCount ?? 0"
          [pageSize]="pageSize"
          [pageSizeOptions]="[25, 50, 100]"
          (page)="onPage($event)" />
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; margin-bottom: 16px; }
    .page-header h2 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .filters { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .filters mat-form-field { min-width: 180px; }
    .table-container { background: white; border-radius: 8px; overflow: hidden; }
    table { width: 100%; }
    .spinner-center { display: flex; justify-content: center; padding: 48px; }
    .detail-text { font-size: 0.8rem; color: #666; cursor: help; }
  `]
})
export class AuditLogsComponent implements OnInit {
  private auditService = inject(AuditLogsService);
  private snackBar = inject(MatSnackBar);

  columns = ['timestamp', 'username', 'action', 'entity', 'ip', 'details'];
  loading = signal(false);
  data = signal<AuditLogsPageResponse | null>(null);
  page = 1;
  pageSize = 50;
  filterAction = '';
  filterEntity = '';

  actions = [
    'user.login', 'user.login_failed', 'user.logout',
    'user.created', 'user.updated', 'user.deactivated',
    'user.password_changed', 'user.password_reset',
    'program.created', 'program.updated', 'program.deleted',
    'program.assigned', 'program.revoked'
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.auditService.getLogs({
      page: this.page,
      pageSize: this.pageSize,
      action: this.filterAction || undefined,
      entityName: this.filterEntity || undefined
    }).subscribe({
      next: res => { this.data.set(res); this.loading.set(false); },
      error: () => { this.loading.set(false); this.snackBar.open('Errore nel caricamento log', 'OK', { duration: 3000 }); }
    });
  }

  onPage(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.load();
  }

  clearFilters(): void {
    this.filterAction = '';
    this.filterEntity = '';
    this.page = 1;
    this.load();
  }

  getActionColor(action: string): string {
    if (action.includes('failed') || action.includes('deleted') || action.includes('deactivated')) return 'warn';
    if (action.includes('login')) return 'primary';
    return 'accent';
  }
}
