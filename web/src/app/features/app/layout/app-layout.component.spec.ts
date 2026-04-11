import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppLayoutComponent } from './app-layout.component';
import { AuthService } from '../../../core/services/auth.service';

describe('AppLayoutComponent', () => {
  let fixture: ComponentFixture<AppLayoutComponent>;
  let compiled: HTMLElement;

  const mockUser = {
    id: 2,
    email: 'user@test.com',
    username: 'testuser',
    loginArea: 2 as const,
    roles: ['User'],
    programs: ['PROG_A', 'PROG_B']
  };

  const mockAuthService = {
    currentUser: signal(mockUser),
    logout: jasmine.createSpy('logout')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent, RouterTestingModule, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: mockAuthService }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppLayoutComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  afterEach(() => mockAuthService.logout.calls.reset());

  it('mostra il titolo "MesClaude" nella toolbar', () => {
    expect(compiled.querySelector('mat-toolbar')?.textContent).toContain('MesClaude');
  });

  it('mostra il nome utente nella toolbar', () => {
    expect(compiled.querySelector('.user-info')?.textContent).toContain('testuser');
  });

  it('mostra i programmi assegnati nel sidenav', () => {
    const sidenavText = compiled.querySelector('mat-sidenav')?.textContent ?? '';
    expect(sidenavText).toContain('PROG_A');
    expect(sidenavText).toContain('PROG_B');
  });

  it('mostra "Nessun programma assegnato" quando la lista è vuota', async () => {
    mockAuthService.currentUser = signal({ ...mockUser, programs: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    const sidenavText = compiled.querySelector('mat-sidenav')?.textContent ?? '';
    expect(sidenavText).toContain('Nessun programma assegnato');
  });

  it('chiama authService.logout() al click su Esci', () => {
    const component = fixture.componentInstance;
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
  });
});
