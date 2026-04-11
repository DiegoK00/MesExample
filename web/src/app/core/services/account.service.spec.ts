import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AccountService } from './account.service';
import { environment } from '../../../environments/environment';

describe('AccountService', () => {
  let service: AccountService;
  let httpMock: HttpTestingController;

  const mockUser = {
    id: 1,
    email: 'admin@test.com',
    username: 'admin',
    loginArea: 1 as const,
    roles: ['SuperAdmin'],
    programs: ['GESTIONE_ORDINI']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AccountService]
    });
    service = TestBed.inject(AccountService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getMe', () => {
    it('should GET /account/me and return current user', () => {
      service.getMe().subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/account/me`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });
  });

  describe('changePassword', () => {
    it('should PUT /account/password with correct body', () => {
      service.changePassword('OldPass@1', 'NewPass@1').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/account/password`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ currentPassword: 'OldPass@1', newPassword: 'NewPass@1' });
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
