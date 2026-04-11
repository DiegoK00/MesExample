import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AdminLayoutComponent } from './admin-layout.component';
import { AuthService } from '../../../core/services/auth.service';

describe('AdminLayoutComponent', () => {
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let compiled: HTMLElement;

  const mockUser = {
    id: 1,
    email: 'admin@test.com',
    username: 'admin',
    loginArea: 1 as const,
    roles: ['SuperAdmin'],
    programs: []
  };

  const mockAuthService = {
    currentUser: signal(mockUser),
    logout: jasmine.createSpy('logout')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: mockAuthService }]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  afterEach(() => mockAuthService.logout.calls.reset());

  it('mostra il titolo "Backoffice" nella toolbar', () => {
    expect(compiled.querySelector('mat-toolbar')?.textContent).toContain('Backoffice');
  });

  it('mostra il nome utente nella toolbar', () => {
    expect(compiled.querySelector('.user-info')?.textContent).toContain('admin');
  });

  it('il pulsante menu ha aria-label="Menu"', () => {
    const btn = compiled.querySelector('button[aria-label="Menu"]');
    expect(btn).toBeTruthy();
  });

  it('chiama authService.logout() al click su Esci', () => {
    const component = fixture.componentInstance;
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
  });

  it('contiene i 3 nav items nel sidenav', () => {
    const component = fixture.componentInstance;
    expect(component.navItems.length).toBe(3);
    const labels = component.navItems.map(i => i.label);
    expect(labels).toContain('Utenti');
    expect(labels).toContain('Programmi');
    expect(labels).toContain('Audit Log');
  });
});
