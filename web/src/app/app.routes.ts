import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'admin/login', pathMatch: 'full' },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'app',
    loadChildren: () => import('./features/app/app.routes').then(m => m.APP_ROUTES)
  },
  { path: '**', redirectTo: 'admin/login' }
];
