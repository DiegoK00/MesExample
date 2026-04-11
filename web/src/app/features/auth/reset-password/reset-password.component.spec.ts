import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  let authSpy: jasmine.SpyObj<AuthService>;

  function buildRoute(area: number, token?: string) {
    return {
      snapshot: {
        data: { area },
        queryParams: token ? { token } : {}
      }
    };
  }

  function setup(area = 1, token?: string) {
    authSpy = jasmine.createSpyObj('AuthService', ['resetPassword']);
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: buildRoute(area, token) },
      ]
    });
    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should show invalid-token widget when no token in query params', () => {
    setup(1, undefined);
    expect(component.token()).toBe('');
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Token non valido');
  });

  it('should show the password form when token is present', () => {
    setup(1, 'abc123');
    expect(component.token()).toBe('abc123');
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('form')).toBeTruthy();
  });

  it('loginPath() returns /admin/login for area 1', () => {
    setup(1, 'tok');
    expect(component.loginPath()).toBe('/admin/login');
  });

  it('loginPath() returns /app/login for area 2', () => {
    setup(2, 'tok');
    expect(component.loginPath()).toBe('/app/login');
  });

  it('should not call resetPassword when form is invalid', () => {
    setup(1, 'tok');
    component.onSubmit();
    expect(authSpy.resetPassword).not.toHaveBeenCalled();
  });

  it('should call resetPassword with token and new password on valid submit', () => {
    setup(1, 'mytoken');
    authSpy.resetPassword.and.returnValue(of(undefined));
    component.form.setValue({ newPassword: 'newpass123', confirmPassword: 'newpass123' });
    component.onSubmit();
    expect(authSpy.resetPassword).toHaveBeenCalledWith('mytoken', 'newpass123');
  });

  it('should show success state after successful reset', () => {
    setup(1, 'mytoken');
    authSpy.resetPassword.and.returnValue(of(undefined));
    component.form.setValue({ newPassword: 'newpass123', confirmPassword: 'newpass123' });
    component.onSubmit();
    fixture.detectChanges();
    expect(component.done()).toBeTrue();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Password aggiornata');
  });

  it('should show error message when token is invalid (server returns error)', () => {
    setup(1, 'expiredtoken');
    authSpy.resetPassword.and.returnValue(throwError(() => new Error('400')));
    component.form.setValue({ newPassword: 'newpass123', confirmPassword: 'newpass123' });
    component.onSubmit();
    fixture.detectChanges();
    expect(component.errorMessage()).toContain('Token non valido');
    expect(component.done()).toBeFalse();
  });

  it('passwordsMismatch: should not submit when passwords differ', () => {
    setup(1, 'tok');
    component.form.setValue({ newPassword: 'pass1234', confirmPassword: 'different' });
    component.onSubmit();
    expect(authSpy.resetPassword).not.toHaveBeenCalled();
  });
});
