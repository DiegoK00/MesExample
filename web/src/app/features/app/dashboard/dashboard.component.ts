import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatCardModule, MatIconModule, MatChipsModule],
  template: `
    <h2>Benvenuto, {{ authService.currentUser()?.username }}</h2>

    <div class="cards-grid">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>person</mat-icon>
          <mat-card-title>Profilo</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Email:</strong> {{ authService.currentUser()?.email }}</p>
          <p><strong>Ruoli:</strong>
            <mat-chip-set>
              @for (role of authService.currentUser()?.roles ?? []; track role) {
                <mat-chip>{{ role }}</mat-chip>
              }
            </mat-chip-set>
          </p>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>apps</mat-icon>
          <mat-card-title>Programmi assegnati</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (authService.currentUser()?.programs?.length) {
            <mat-chip-set>
              @for (prog of authService.currentUser()?.programs ?? []; track prog) {
                <mat-chip color="primary" highlighted>{{ prog }}</mat-chip>
              }
            </mat-chip-set>
          } @else {
            <p class="empty">Nessun programma assegnato.</p>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    h2 { margin: 0 0 24px; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    mat-card-content { padding-top: 12px; }
    .empty { color: #999; font-style: italic; }
    p { margin: 8px 0; }
  `]
})
export class DashboardComponent {
  authService = inject(AuthService);
}
