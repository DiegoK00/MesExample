import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let authSpy: jasmine.SpyObj<AuthService>;

  function buildRoute(area: number) {
    return { snapshot: { data: { area }, queryParams: {} } };
  }

  function setup(area = 1) {
    authSpy = jasmine.createSpyObj('AuthService', ['forgotPassword']);
    TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: buildRoute(area) },
      ]
    });
    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should initialise area from route data', () => {
    setup(1);
    expect(component.area()).toBe(1);
  });

  it('should show the email form before submission', () => {
    setup(1);
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')!.textContent).toContain('Invia istruzioni');
  });

  it('loginPath() returns /admin/login for area 1', () => {
    setup(1);
    expect(component.loginPath()).toBe('/admin/login');
  });

  it('loginPath() returns /app/login for area 2', () => {
    setup(2);
    expect(component.loginPath()).toBe('/app/login');
  });

  it('should not call forgotPassword when form is invalid', () => {
    setup(1);
    component.onSubmit();
    expect(authSpy.forgotPassword).not.toHaveBeenCalled();
  });

  it('should call forgotPassword with email and area on valid submit', () => {
    setup(1);
    authSpy.forgotPassword.and.returnValue(of(undefined));
    component.form.setValue({ email: 'test@test.com' });
    component.onSubmit();
    expect(authSpy.forgotPassword).toHaveBeenCalledWith('test@test.com', 1);
  });

  it('should show success state after successful submission', () => {
    setup(1);
    authSpy.forgotPassword.and.returnValue(of(undefined));
    component.form.setValue({ email: 'test@test.com' });
    component.onSubmit();
    fixture.detectChanges();
    expect(component.sent()).toBeTrue();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('riceverai un');
  });

  it('should show success state even on server error (anti-enumeration)', () => {
    setup(1);
    authSpy.forgotPassword.and.returnValue(throwError(() => new Error('500')));
    component.form.setValue({ email: 'notfound@test.com' });
    component.onSubmit();
    fixture.detectChanges();
    expect(component.sent()).toBeTrue();
  });
});
