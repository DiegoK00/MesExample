import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { adminGuard, appGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';

describe('Auth Guards', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockUser = {
    id: 1,
    email: 'admin@test.com',
    username: 'admin',
    loginArea: 1 as const,
    roles: ['SuperAdmin'],
    programs: []
  };

  function runGuard(guard: 'admin' | 'app') {
    return TestBed.runInInjectionContext(() =>
      guard === 'admin' ? adminGuard({} as any, {} as any) : appGuard({} as any, {} as any)
    );
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'currentUser', 'setCurrentUser'], {
      isLoggedIn: jasmine.createSpy().and.returnValue(false),
      currentUser: jasmine.createSpy().and.returnValue(null)
    });
    accountServiceSpy = jasmine.createSpyObj('AccountService', ['getMe']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });
  });

  describe('adminGuard', () => {
    it('should redirect to /admin/login and return false when not logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);

      const result = runGuard('admin');

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/login']);
    });

    it('should return true immediately when logged in and currentUser is set', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue(mockUser);

      const result = runGuard('admin');

      expect(result).toBeTrue();
      expect(accountServiceSpy.getMe).not.toHaveBeenCalled();
    });

    it('should call getMe and return true when logged in but currentUser is null', (done) => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue(null);
      accountServiceSpy.getMe.and.returnValue(of(mockUser));

      const result = runGuard('admin') as any;

      result.subscribe((can: boolean) => {
        expect(can).toBeTrue();
        expect(authServiceSpy.setCurrentUser).toHaveBeenCalledWith(mockUser);
        done();
      });
    });

    it('should redirect to /admin/login and return false when getMe fails', (done) => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue(null);
      accountServiceSpy.getMe.and.returnValue(throwError(() => new Error('Unauthorized')));

      const result = runGuard('admin') as any;

      result.subscribe((can: boolean) => {
        expect(can).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/login']);
        done();
      });
    });
  });

  describe('appGuard', () => {
    it('should redirect to /app/login and return false when not logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);

      const result = runGuard('app');

      expect(result).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/app/login']);
    });

    it('should return true immediately when logged in and currentUser is set', () => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue(mockUser);

      const result = runGuard('app');

      expect(result).toBeTrue();
    });

    it('should call getMe and return true when logged in but currentUser is null', (done) => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue(null);
      accountServiceSpy.getMe.and.returnValue(of(mockUser));

      const result = runGuard('app') as any;

      result.subscribe((can: boolean) => {
        expect(can).toBeTrue();
        done();
      });
    });

    it('should redirect to /app/login when getMe fails', (done) => {
      authServiceSpy.isLoggedIn.and.returnValue(true);
      authServiceSpy.currentUser.and.returnValue(null);
      accountServiceSpy.getMe.and.returnValue(throwError(() => new Error('Unauthorized')));

      const result = runGuard('app') as any;

      result.subscribe((can: boolean) => {
        expect(can).toBeFalse();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/app/login']);
        done();
      });
    });
  });
});
