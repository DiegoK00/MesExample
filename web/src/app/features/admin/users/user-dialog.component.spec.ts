import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { UserDialogComponent } from './user-dialog.component';
import { UsersService } from '../../../core/services/users.service';

describe('UserDialogComponent', () => {
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UserDialogComponent>>;

  const mockUser = {
    id: 5,
    email: 'mario@test.com',
    username: 'mario',
    loginArea: 1 as const,
    roles: ['Admin'],
    isActive: true,
    createdAt: '2026-01-01T10:00:00',
    lastLoginAt: '2026-04-10T15:30:00'
  };

  function createFixture(dialogData: any): ComponentFixture<UserDialogComponent> {
    TestBed.configureTestingModule({
      imports: [UserDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: UsersService, useValue: usersServiceSpy }
      ]
    }).compileComponents();

    const f = TestBed.createComponent(UserDialogComponent);
    f.detectChanges();
    return f;
  }

  beforeEach(() => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['create', 'update']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('modalità creazione', () => {
    let fixture: ComponentFixture<UserDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({});
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Nuovo Utente"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Nuovo Utente');
    });

    it('mostra il campo Password', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).toContain('Password');
    });

    it('mostra il campo Area di login', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).toContain('Area di login');
    });

    it('form invalido con campi vuoti al submit', () => {
      const component = fixture.componentInstance;
      component.submit();
      expect(component.form.invalid).toBeTrue();
      expect(usersServiceSpy.create).not.toHaveBeenCalled();
    });

    it('chiama create() con form valido', () => {
      usersServiceSpy.create.and.returnValue(of({ ...mockUser, id: 10 }));
      const component = fixture.componentInstance;
      component.form.setValue({
        email: 'new@test.com',
        username: 'newuser',
        password: 'password123',
        loginArea: 1,
        roleIds: [3]
      });
      component.submit();
      expect(usersServiceSpy.create).toHaveBeenCalledWith({
        email: 'new@test.com',
        username: 'newuser',
        password: 'password123',
        loginArea: 1,
        roleIds: [3]
      });
    });
  });

  describe('modalità modifica', () => {
    let fixture: ComponentFixture<UserDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({ user: mockUser });
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Modifica Utente"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Modifica Utente');
    });

    it('non mostra il campo Password', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).not.toContain('Password');
    });

    it('pre-popola l\'email dal dato utente', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('email')?.value).toBe('mario@test.com');
    });

    it('chiama update() al submit', () => {
      usersServiceSpy.update.and.returnValue(of(mockUser));
      const component = fixture.componentInstance;
      component.submit();
      expect(usersServiceSpy.update).toHaveBeenCalledWith(5, jasmine.objectContaining({
        email: 'mario@test.com',
        username: 'mario'
      }));
    });
  });
});
