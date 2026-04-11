import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { environment } from '../../../environments/environment';
import { UserResponse, UsersPageResponse } from '../models/user.models';
import { UserProgramResponse } from '../models/program.models';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

  const mockUser: UserResponse = {
    id: 1,
    email: 'user@test.com',
    username: 'user1',
    loginArea: 2,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    lastLoginAt: null,
    roles: ['User']
  };

  const mockPageResponse: UsersPageResponse = {
    items: [mockUser],
    totalCount: 1,
    page: 1,
    pageSize: 20,
    totalPages: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UsersService]
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getAll', () => {
    it('should GET /users with default pagination params', () => {
      service.getAll().subscribe(res => expect(res).toEqual(mockPageResponse));

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/users`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('page')).toBe('1');
      expect(req.request.params.get('pageSize')).toBe('20');
      req.flush(mockPageResponse);
    });

    it('should include search param when provided', () => {
      service.getAll(1, 20, 'mario').subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/users`);
      expect(req.request.params.get('search')).toBe('mario');
      req.flush(mockPageResponse);
    });

    it('should not include search param when not provided', () => {
      service.getAll().subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/users`);
      expect(req.request.params.has('search')).toBeFalse();
      req.flush(mockPageResponse);
    });
  });

  describe('getById', () => {
    it('should GET /users/:id', () => {
      service.getById(1).subscribe(res => expect(res).toEqual(mockUser));

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('create', () => {
    it('should POST /users with create request', () => {
      const createReq = { email: 'new@test.com', username: 'new', password: 'Pass@1', loginArea: 2 as const, roleIds: [3] };
      service.create(createReq).subscribe(res => expect(res).toEqual(mockUser));

      const req = httpMock.expectOne(`${environment.apiUrl}/users`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createReq);
      req.flush(mockUser);
    });
  });

  describe('update', () => {
    it('should PUT /users/:id with update request', () => {
      const updateReq = { email: 'updated@test.com', username: 'updated', isActive: true, roleIds: [3] };
      service.update(1, updateReq).subscribe(res => expect(res).toEqual(mockUser));

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateReq);
      req.flush(mockUser);
    });
  });

  describe('deactivate', () => {
    it('should DELETE /users/:id', () => {
      service.deactivate(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('getUserPrograms', () => {
    it('should GET /users/:id/programs', () => {
      const mockPrograms: UserProgramResponse[] = [{
        programId: 1,
        code: 'GESTIONE_ORDINI',
        name: 'Gestione Ordini',
        grantedAt: '2026-01-01T00:00:00Z',
        grantedByUsername: 'admin'
      }];

      service.getUserPrograms(1).subscribe(res => expect(res).toEqual(mockPrograms));

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1/programs`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPrograms);
    });
  });

  describe('assignPrograms', () => {
    it('should POST /users/:id/programs with programIds', () => {
      service.assignPrograms(1, [1, 2]).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1/programs`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ programIds: [1, 2] });
      req.flush([]);
    });
  });

  describe('revokePrograms', () => {
    it('should DELETE /users/:id/programs with programIds in body', () => {
      service.revokePrograms(1, [1]).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/users/1/programs`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.body).toEqual({ programIds: [1] });
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
