import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuditLogsComponent } from './audit-logs.component';
import { AuditLogsService } from '../../../core/services/audit-logs.service';
import { AuditLogsPageResponse } from '../../../core/models/audit-log.models';

describe('AuditLogsComponent', () => {
  let fixture: ComponentFixture<AuditLogsComponent>;
  let component: AuditLogsComponent;
  let compiled: HTMLElement;
  let auditServiceSpy: jasmine.SpyObj<AuditLogsService>;

  const mockData: AuditLogsPageResponse = {
    items: [
      {
        id: 1,
        userId: 1,
        action: 'user.login',
        entityName: 'User',
        entityId: '1',
        username: 'admin',
        ipAddress: '127.0.0.1',
        timestamp: '2026-01-15T10:00:00Z',
        oldValues: null,
        newValues: null
      },
      {
        id: 2,
        userId: 1,
        action: 'program.created',
        entityName: 'Program',
        entityId: '5',
        username: 'admin',
        ipAddress: '127.0.0.1',
        timestamp: '2026-01-15T11:00:00Z',
        oldValues: null,
        newValues: '{"code":"PROG_TEST"}'
      }
    ],
    totalCount: 2,
    page: 1,
    pageSize: 50,
    totalPages: 1
  };

  beforeEach(async () => {
    auditServiceSpy = jasmine.createSpyObj('AuditLogsService', ['getLogs']);
    auditServiceSpy.getLogs.and.returnValue(of(mockData));

    await TestBed.configureTestingModule({
      imports: [AuditLogsComponent, NoopAnimationsModule],
      providers: [{ provide: AuditLogsService, useValue: auditServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('mostra le colonne Azione, Entità, Timestamp nella tabella', () => {
    const headers = Array.from(compiled.querySelectorAll('th')).map(th => th.textContent?.trim());
    expect(headers).toContain('Azione');
    expect(headers).toContain('Entità');
    expect(headers).toContain('Timestamp');
  });

  it('mostra i dati mock nella tabella', () => {
    const rows = compiled.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
    expect(compiled.textContent).toContain('user.login');
    expect(compiled.textContent).toContain('program.created');
  });

  it('chiama getLogs() all\'inizializzazione', () => {
    expect(auditServiceSpy.getLogs).toHaveBeenCalledTimes(1);
  });

  it('impostare filterAction chiama getLogs con il filtro', () => {
    component.filterAction = 'user.login';
    component.load();
    expect(auditServiceSpy.getLogs).toHaveBeenCalledWith(jasmine.objectContaining({
      action: 'user.login'
    }));
  });

  it('clearFilters() azzera i filtri e ricarica', () => {
    component.filterAction = 'user.login';
    component.filterEntity = 'User';
    component.page = 3;
    component.clearFilters();
    expect(component.filterAction).toBe('');
    expect(component.filterEntity).toBe('');
    expect(component.page).toBe(1);
    expect(auditServiceSpy.getLogs).toHaveBeenCalledTimes(2);
  });

  it('getActionColor() restituisce "warn" per azioni fallite', () => {
    expect(component.getActionColor('user.login_failed')).toBe('warn');
    expect(component.getActionColor('user.deactivated')).toBe('warn');
    expect(component.getActionColor('program.deleted')).toBe('warn');
  });

  it('getActionColor() restituisce "primary" per login', () => {
    expect(component.getActionColor('user.login')).toBe('primary');
  });
});
