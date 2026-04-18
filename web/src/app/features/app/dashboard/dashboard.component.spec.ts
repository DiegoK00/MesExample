import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './dashboard.component';
import { AuthService } from '../../../core/services/auth.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let compiled: HTMLElement;

  const mockUser = {
    id: 2,
    email: 'user@test.com',
    username: 'testuser',
    loginArea: 2 as const,
    roles: ['User', 'Admin'],
    programs: ['PROG_A', 'PROG_B']
  };

  const mockAuthService = { currentUser: signal(mockUser) };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, NoopAnimationsModule],
      providers: [{ provide: AuthService, useValue: mockAuthService }]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('mostra "Benvenuto, {username}" nell\'intestazione', () => {
    expect(compiled.querySelector('h2')?.textContent).toContain('testuser');
  });

  it('mostra l\'email dell\'utente', () => {
    expect(compiled.textContent).toContain('user@test.com');
  });

  it('mostra i ruoli dell\'utente', () => {
    expect(compiled.textContent).toContain('User');
    expect(compiled.textContent).toContain('Admin');
  });

  it('mostra i programmi assegnati', () => {
    expect(compiled.textContent).toContain('PROG_A');
    expect(compiled.textContent).toContain('PROG_B');
  });

  it('mostra "Nessun programma assegnato" se lista vuota', async () => {
    mockAuthService.currentUser.set({ ...mockUser, programs: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    expect(compiled.textContent).toContain('Nessun programma assegnato');
  });

  afterEach(() => mockAuthService.currentUser.set(mockUser));
});
