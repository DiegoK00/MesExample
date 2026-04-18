import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { UsersComponent } from './users.component';
import { UsersService } from '../../../core/services/users.service';
import { MatDialog } from '@angular/material/dialog';
import { UsersPageResponse } from '../../../core/models/user.models';

describe('UsersComponent', () => {
  let fixture: ComponentFixture<UsersComponent>;
  let component: UsersComponent;
  let compiled: HTMLElement;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockData: UsersPageResponse = {
    items: [
      { id: 1, email: 'mario@test.com', username: 'mario', loginArea: 1, roles: ['Admin'], isActive: true, createdAt: '2026-01-01T10:00:00', lastLoginAt: '2026-04-10T15:30:00' },
      { id: 2, email: 'luigi@test.com', username: 'luigi', loginArea: 2, roles: ['User'], isActive: false, createdAt: '2026-02-01T10:00:00', lastLoginAt: null }
    ],
    totalCount: 2,
    page: 1,
    pageSize: 20,
    totalPages: 1
  };

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getAll', 'deactivate']);
    usersServiceSpy.getAll.and.returnValue(of(mockData));
    usersServiceSpy.deactivate.and.returnValue(of(void 0));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    await TestBed.configureTestingModule({
      imports: [UsersComponent, NoopAnimationsModule],
      providers: [
        { provide: UsersService, useValue: usersServiceSpy }
      ]
    }).overrideProvider(MatDialog, { useValue: dialogSpy }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('mostra le colonne Email, Username, Stato nella tabella', () => {
    const headers = Array.from(compiled.querySelectorAll('th')).map(th => th.textContent?.trim());
    expect(headers).toContain('Email');
    expect(headers).toContain('Username');
    expect(headers).toContain('Stato');
  });

  it('mostra i dati mock nella tabella', () => {
    const rows = compiled.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
    expect(compiled.textContent).toContain('mario@test.com');
    expect(compiled.textContent).toContain('luigi');
  });

  it('chiama getAll() all\'inizializzazione', () => {
    expect(usersServiceSpy.getAll).toHaveBeenCalledTimes(1);
  });

  it('search() chiama getAll e resetta alla pagina 1', () => {
    component.page = 3;
    component.search();
    expect(component.page).toBe(1);
    expect(usersServiceSpy.getAll).toHaveBeenCalledTimes(2);
  });

  it('deactivate() chiama usersService.deactivate dopo conferma', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.deactivate(mockData.items[0]);
    expect(usersServiceSpy.deactivate).toHaveBeenCalledWith(1);
  });

  it('deactivate() non chiama il servizio se l\'utente annulla', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.deactivate(mockData.items[0]);
    expect(usersServiceSpy.deactivate).not.toHaveBeenCalled();
  });

  it('openCreateDialog() apre il dialog', () => {
    component.openCreateDialog();
    expect(dialogSpy.open).toHaveBeenCalled();
  });
});
