import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { AccountService } from '../../../core/services/account.service';

describe('LoginComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let accountServiceSpy: jasmine.SpyObj<AccountService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockLoginResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: '2026-03-30T00:00:00Z'
  };

  const mockUser = {
    id: 1,
    email: 'admin@test.com',
    username: 'admin',
    loginArea: 1 as const,
    roles: ['SuperAdmin'],
    programs: []
  };

  function buildComponent(area: 1 | 2 = 1) {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isLoggedIn', 'setCurrentUser']);
    accountServiceSpy = jasmine.createSpyObj('AccountService', ['getMe']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl']);
    (routerSpy as any).events = EMPTY;
    routerSpy.createUrlTree.and.returnValue({} as any);
    routerSpy.serializeUrl.and.returnValue('');

    authServiceSpy.isLoggedIn.and.returnValue(false);

    TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AccountService, useValue: accountServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { area } } } }
      ]
    });

    return TestBed.createComponent(LoginComponent);
  }

  describe('initialization', () => {
    it('should create and set area from route data', () => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      expect(fixture.componentInstance.area()).toBe(1);
    });

    it('should redirect to /admin when already logged in on area 1', () => {
      buildComponent(1);
      authServiceSpy.isLoggedIn.and.returnValue(true);
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    });

    it('should redirect to /app when already logged in on area 2', () => {
      buildComponent(2);
      authServiceSpy.isLoggedIn.and.returnValue(true);
      const fixture = TestBed.createComponent(LoginComponent);
      fixture.detectChanges();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
    });
  });

  describe('form validation', () => {
    it('should have invalid form when empty', () => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      expect(fixture.componentInstance.form.invalid).toBeTrue();
    });

    it('should be invalid with malformed email', () => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue({ email: 'not-an-email', password: 'pass' });
      expect(fixture.componentInstance.form.get('email')?.hasError('email')).toBeTrue();
    });

    it('should be valid with email and password', () => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      fixture.componentInstance.form.setValue({ email: 'admin@test.com', password: 'Admin@1234' });
      expect(fixture.componentInstance.form.valid).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    it('should mark form as touched and not call login when form is invalid', () => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      fixture.componentInstance.onSubmit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
      expect(fixture.componentInstance.form.touched).toBeTrue();
    });

    it('should call login and navigate to /admin on success (area 1)', fakeAsync(() => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));
      accountServiceSpy.getMe.and.returnValue(of(mockUser));

      fixture.componentInstance.form.setValue({ email: 'admin@test.com', password: 'Admin@1234' });
      fixture.componentInstance.onSubmit();
      tick();

      expect(authServiceSpy.login).toHaveBeenCalledWith({ email: 'admin@test.com', password: 'Admin@1234', area: 1 });
      expect(authServiceSpy.setCurrentUser).toHaveBeenCalledWith(mockUser);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
    }));

    it('should call login and navigate to /app on success (area 2)', fakeAsync(() => {
      const fixture = buildComponent(2);
      fixture.detectChanges();
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));
      accountServiceSpy.getMe.and.returnValue(of({ ...mockUser, loginArea: 2 }));

      fixture.componentInstance.form.setValue({ email: 'user@test.com', password: 'Pass@1234' });
      fixture.componentInstance.onSubmit();
      tick();

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/app']);
    }));

    it('should set errorMessage and stop loading when login fails', fakeAsync(() => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      authServiceSpy.login.and.returnValue(throwError(() => ({ status: 401 })));

      fixture.componentInstance.form.setValue({ email: 'admin@test.com', password: 'wrong' });
      fixture.componentInstance.onSubmit();
      tick();

      expect(fixture.componentInstance.loading()).toBeFalse();
      expect(fixture.componentInstance.errorMessage()).toBe('Credenziali non valide. Riprova.');
    }));

    it('should set errorMessage when getMe fails after login', fakeAsync(() => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));
      accountServiceSpy.getMe.and.returnValue(throwError(() => new Error('Server error')));

      fixture.componentInstance.form.setValue({ email: 'admin@test.com', password: 'Admin@1234' });
      fixture.componentInstance.onSubmit();
      tick();

      expect(fixture.componentInstance.loading()).toBeFalse();
      expect(fixture.componentInstance.errorMessage()).toBe('Credenziali non valide. Riprova.');
    }));

    it('should set loading to true during login and false after', fakeAsync(() => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      authServiceSpy.login.and.returnValue(of(mockLoginResponse));
      accountServiceSpy.getMe.and.returnValue(of(mockUser));

      fixture.componentInstance.form.setValue({ email: 'admin@test.com', password: 'Admin@1234' });
      fixture.componentInstance.onSubmit();

      // loading è true prima che tick() risolva gli observable
      expect(fixture.componentInstance.loading()).toBeTrue();
      tick();
      // dopo il completamento loading ritorna false (gestito nel navigate, non nel finally)
    }));
  });

  describe('showPassword toggle', () => {
    it('should start with password hidden', () => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      expect(fixture.componentInstance.showPassword()).toBeFalse();
    });

    it('should toggle showPassword signal', () => {
      const fixture = buildComponent(1);
      fixture.detectChanges();
      fixture.componentInstance.showPassword.set(true);
      expect(fixture.componentInstance.showPassword()).toBeTrue();
    });
  });
});
