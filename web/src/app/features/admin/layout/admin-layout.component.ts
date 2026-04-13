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

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
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

      <!-- Contenuto principale -->
      <mat-sidenav-content class="main-content">
        <mat-toolbar color="primary" class="toolbar">
          <span class="toolbar-title">
            <mat-icon>admin_panel_settings</mat-icon>
            Backoffice
          </span>
          <span class="spacer"></span>
          <span class="user-info">{{ authService.currentUser()?.username }}</span>
          <button mat-icon-button (click)="sidenav.toggle()" aria-label="Menu" matTooltip="Menu">
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
          <mat-icon>admin_panel_settings</mat-icon>
          <span>Menu Admin</span>
          <button mat-icon-button (click)="sidenav.close()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <mat-divider />

        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a mat-list-item
              [routerLink]="item.route"
              routerLinkActive="active-link"
              (click)="sidenav.close()">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <mat-divider />

        <mat-nav-list>
          <a mat-list-item (click)="openChangePassword(); sidenav.close()">
            <mat-icon matListItemIcon>lock</mat-icon>
            <span matListItemTitle>Cambia password</span>
          </a>
          <a mat-list-item role="link" (click)="logout()">
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
    .toolbar-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; }
    .spacer { flex: 1; }
    .user-info { margin-right: 12px; font-size: 0.9rem; opacity: 0.9; }
    .content-area { flex: 1; padding: 24px; overflow-y: auto; background: #f5f5f5; }
    .sidenav { width: 260px; }
    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      font-size: 1rem;
      font-weight: 500;
    }
    .sidenav-header button { margin-left: auto; }
    .active-link { background: rgba(63, 81, 181, 0.1); font-weight: 600; }
    .active-link mat-icon { color: #3f51b5; }
  `]
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  private dialog = inject(MatDialog);
  sidenavOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Utenti', icon: 'people', route: '/admin/users' },
    { label: 'Programmi', icon: 'apps', route: '/admin/programs' },
    { label: 'Articoli', icon: 'inventory_2', route: '/admin/articles' },
    { label: 'Categorie', icon: 'category', route: '/admin/categories' },
    { label: 'Unità di Misura', icon: 'straighten', route: '/admin/measure-units' },
    { label: 'Audit Log', icon: 'history', route: '/admin/audit-logs' }
  ];

  openChangePassword(): void {
    this.dialog.open(ChangePasswordComponent, { width: '420px' });
  }

  logout(): void {
    this.authService.logout();
  }
}
