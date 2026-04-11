import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import { tap } from 'rxjs/operators';
import { map, catchError } from 'rxjs';
import { of } from 'rxjs';

export const adminGuard: CanActivateFn = () => {
  return checkAuth('admin');
};

export const appGuard: CanActivateFn = () => {
  return checkAuth('app');
};

function checkAuth(area: 'admin' | 'app') {
  const authService = inject(AuthService);
  const accountService = inject(AccountService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    router.navigate([`/${area}/login`]);
    return false;
  }

  if (authService.currentUser()) {
    return true;
  }

  // Token presente ma currentUser non ancora caricato → chiama /account/me
  return accountService.getMe().pipe(
    tap(user => authService.setCurrentUser(user)),
    map(() => true),
    catchError(() => {
      router.navigate([`/${area}/login`]);
      return of(false);
    })
  );
}
