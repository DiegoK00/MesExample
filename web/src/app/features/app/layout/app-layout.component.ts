import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { ChangePasswordComponent } from '../../auth/change-password/change-password.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">

      <mat-sidenav-content class="main-content">
        <mat-toolbar color="accent" class="toolbar">
          <span class="toolbar-title">
            <mat-icon>apps</mat-icon>
            MesClaude
          </span>
          <span class="spacer"></span>
          <span class="user-info">{{ authService.currentUser()?.username }}</span>
          <button mat-icon-button (click)="sidenav.toggle()" matTooltip="Menu">
            <mat-icon>menu</mat-icon>
          </button>
        </mat-toolbar>

        <div class="content-area">
          <router-outlet />
        </div>
      </mat-sidenav-content>

      <!-- Sidenav a destra -->
      <mat-sidenav #sidenav position="end" mode="over" [opened]="sidenavOpen()"
        (openedChange)="sidenavOpen.set($event)" class="sidenav">

        <div class="sidenav-header">
          <mat-icon>person</mat-icon>
          <span>{{ authService.currentUser()?.username }}</span>
          <button mat-icon-button (click)="sidenav.close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <mat-divider />

        <mat-nav-list>
          <a mat-list-item routerLink="/app/dashboard"
            routerLinkActive="active-link" (click)="sidenav.close()">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
        </mat-nav-list>

        <mat-divider />

        <div class="programs-section">
          <p class="section-title">I miei programmi</p>
          @for (prog of authService.currentUser()?.programs ?? []; track prog) {
            <div class="program-chip">
              <mat-icon>check_circle</mat-icon>
              {{ prog }}
            </div>
          }
          @if (!authService.currentUser()?.programs?.length) {
            <p class="no-programs">Nessun programma assegnato</p>
          }
        </div>

        <mat-divider />

        <mat-nav-list>
          <a mat-list-item (click)="openChangePassword(); sidenav.close()">
            <mat-icon matListItemIcon>lock</mat-icon>
            <span matListItemTitle>Cambia password</span>
          </a>
          <a mat-list-item (click)="logout()">
            <mat-icon matListItemIcon color="warn">logout</mat-icon>
            <span matListItemTitle>Esci</span>
          </a>
        </mat-nav-list>

      </mat-sidenav>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .main-content { display: flex; flex-direction: column; height: 100vh; }
    .toolbar { position: sticky; top: 0; z-index: 100; }
    .toolbar-title { display: flex; align-items: center; gap: 8px; }
    .spacer { flex: 1; }
    .user-info { margin-right: 12px; font-size: 0.9rem; opacity: 0.9; }
    .content-area { flex: 1; padding: 24px; overflow-y: auto; background: #f5f5f5; }
    .sidenav { width: 260px; }
    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      font-weight: 500;
    }
    .sidenav-header button { margin-left: auto; }
    .active-link { background: rgba(0,0,0,0.05); }
    .programs-section { padding: 16px; }
    .section-title { font-size: 0.75rem; text-transform: uppercase; color: #666; margin: 0 0 8px; }
    .program-chip { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; padding: 4px 0; color: #333; }
    .program-chip mat-icon { font-size: 16px; width: 16px; height: 16px; color: #4caf50; }
    .no-programs { font-size: 0.8rem; color: #999; }
  `]
})
export class AppLayoutComponent {
  authService = inject(AuthService);
  private dialog = inject(MatDialog);
  sidenavOpen = signal(false);

  openChangePassword(): void {
    this.dialog.open(ChangePasswordComponent, { width: '420px' });
  }

  logout(): void {
    this.authService.logout();
  }
}
