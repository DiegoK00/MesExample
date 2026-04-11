import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuditLogsService } from './audit-logs.service';
import { environment } from '../../../environments/environment';
import { AuditLogsPageResponse } from '../models/audit-log.models';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let httpMock: HttpTestingController;

  const mockResponse: AuditLogsPageResponse = {
    items: [{
      id: 1,
      userId: 1,
      username: 'admin',
      action: 'user.login',
      entityName: 'User',
      entityId: '1',
      oldValues: null,
      newValues: null,
      ipAddress: '127.0.0.1',
      timestamp: '2026-03-29T10:00:00Z'
    }],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuditLogsService]
    });
    service = TestBed.inject(AuditLogsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getLogs', () => {
    it('should GET /audit-logs with default page and pageSize', () => {
      service.getLogs({}).subscribe(res => expect(res).toEqual(mockResponse));

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/audit-logs`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('50');
      req.flush(mockResponse);
    });

    it('should include action filter when provided', () => {
      service.getLogs({ action: 'user.login' }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/audit-logs`);
      expect(req.request.params.get('action')).toBe('user.login');
      req.flush(mockResponse);
    });

    it('should include entityName filter when provided', () => {
      service.getLogs({ entityName: 'User' }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/audit-logs`);
      expect(req.request.params.get('entityName')).toBe('User');
      req.flush(mockResponse);
    });

    it('should include userId filter when provided', () => {
      service.getLogs({ userId: 1 }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/audit-logs`);
      expect(req.request.params.get('userId')).toBe('1');
      req.flush(mockResponse);
    });

    it('should include from and to date filters when provided', () => {
      service.getLogs({ from: '2026-03-01', to: '2026-03-29' }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/audit-logs`);
      expect(req.request.params.get('from')).toBe('2026-03-01');
      expect(req.request.params.get('to')).toBe('2026-03-29');
      req.flush(mockResponse);
    });

    it('should not include optional params when not provided', () => {
      service.getLogs({ page: 2, pageSize: 10 }).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/audit-logs`);
      expect(req.request.params.get('page')).toBe('2');
      expect(req.request.params.get('pageSize')).toBe('10');
      expect(req.request.params.has('action')).toBeFalse();
      expect(req.request.params.has('userId')).toBeFalse();
      expect(req.request.params.has('entityName')).toBeFalse();
      req.flush(mockResponse);
    });
  });
});
