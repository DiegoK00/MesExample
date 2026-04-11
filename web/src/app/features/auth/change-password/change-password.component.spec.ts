import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ChangePasswordComponent } from './change-password.component';
import { AccountService } from '../../../core/services/account.service';

describe('ChangePasswordComponent', () => {
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let component: ChangePasswordComponent;
  let accountSpy: jasmine.SpyObj<AccountService>;

  beforeEach(async () => {
    accountSpy = jasmine.createSpyObj('AccountService', ['changePassword']);

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent, NoopAnimationsModule],
      providers: [
        { provide: AccountService, useValue: accountSpy },
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy() } },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show the form on init', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelector('button[type="submit"]')!.textContent).toContain('Salva');
  });

  it('should not call changePassword when form is invalid', () => {
    component.onSubmit();
    expect(accountSpy.changePassword).not.toHaveBeenCalled();
  });

  it('should not submit when passwords do not match', () => {
    component.form.setValue({
      currentPassword: 'oldpass1',
      newPassword: 'newpass123',
      confirmPassword: 'different1'
    });
    component.onSubmit();
    expect(accountSpy.changePassword).not.toHaveBeenCalled();
  });

  it('should call changePassword with currentPassword and newPassword on valid submit', () => {
    accountSpy.changePassword.and.returnValue(of(undefined));
    component.form.setValue({
      currentPassword: 'oldpass1',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123'
    });
    component.onSubmit();
    expect(accountSpy.changePassword).toHaveBeenCalledWith('oldpass1', 'newpass123');
  });

  it('should show success state after successful submit', () => {
    accountSpy.changePassword.and.returnValue(of(undefined));
    component.form.setValue({
      currentPassword: 'oldpass1',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123'
    });
    component.onSubmit();
    fixture.detectChanges();
    expect(component.success()).toBeTrue();
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.textContent).toContain('Password aggiornata');
  });

  it('should show error message when current password is wrong', () => {
    accountSpy.changePassword.and.returnValue(throwError(() => new Error('400')));
    component.form.setValue({
      currentPassword: 'wrongpass',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123'
    });
    component.onSubmit();
    fixture.detectChanges();
    expect(component.errorMessage()).toContain('non corretta');
    expect(component.success()).toBeFalse();
  });
});
