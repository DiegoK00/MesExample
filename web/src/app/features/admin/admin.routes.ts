import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../auth/login/login.component').then(m => m.LoginComponent),
    data: { area: 1 }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('../auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { area: 1 }
  },
  {
    path: 'reset-password',
    loadComponent: () => import('../auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
    data: { area: 1 }
  },
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      {
        path: 'users',
        loadComponent: () => import('./users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'programs',
        loadComponent: () => import('./programs/programs.component').then(m => m.ProgramsComponent)
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent)
      },
      {
        path: 'measure-units',
        loadComponent: () => import('./measure-units/measure-units.component').then(m => m.MeasureUnitsComponent)
      },
      {
        path: 'articles',
        loadComponent: () => import('./articles/articles.component').then(m => m.ArticlesComponent)
      },
      {
        path: 'articles/:id/bom',
        loadComponent: () => import('./bill-of-materials/bill-of-materials.component').then(m => m.BillOfMaterialsComponent)
      },
      {
        path: 'audit-logs',
        loadComponent: () => import('./audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
      }
    ]
  }
];
