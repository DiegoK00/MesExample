import { Routes } from '@angular/router';
import { appGuard } from '../../core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../auth/login/login.component').then(m => m.LoginComponent),
    data: { area: 2 }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('../auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { area: 2 }
  },
  {
    path: 'reset-password',
    loadComponent: () => import('../auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    data: { area: 2 }
  },
  {
    path: '',
    loadComponent: () => import('./layout/app-layout.component').then(m => m.AppLayoutComponent),
    canActivate: [appGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent)
      }
    ]
  }
];
