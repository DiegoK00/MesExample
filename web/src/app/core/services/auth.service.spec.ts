import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockLoginResponse = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    expiresAt: '2026-03-30T00:00:00Z'
  };

  const mockUser = {
    id: 1,
    email: 'admin@test.com',
    username: 'admin',
    loginArea: 1 as const,
    roles: ['SuperAdmin'],
    programs: ['GESTIONE_ORDINI']
  };

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have isLoggedIn false when no token in storage', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should have isLoggedIn true when token exists in storage', () => {
      localStorage.setItem('access_token', 'existing-token');
      // reinit service to pick up the stored token
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [AuthService, { provide: Router, useValue: routerSpy }]
      });
      const svc = TestBed.inject(AuthService);
      expect(svc.isLoggedIn()).toBeTrue();
      TestBed.inject(HttpTestingController).verify();
    });

    it('should have currentUser null initially', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('isAdmin should be false when no user is set', () => {
      expect(service.isAdmin()).toBeFalse();
    });
  });

  describe('login', () => {
    it('should POST to /auth/login and store tokens', () => {
      service.login({ email: 'admin@test.com', password: 'Admin@1234', area: 1 }).subscribe(res => {
        expect(res).toEqual(mockLoginResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'Admin@1234', area: 1 });
      req.flush(mockLoginResponse);

      expect(localStorage.getItem('access_token')).toBe('access-token-123');
      expect(localStorage.getItem('refresh_token')).toBe('refresh-token-456');
      expect(service.token()).toBe('access-token-123');
      expect(service.isLoggedIn()).toBeTrue();
    });
  });

  describe('logout', () => {
    it('should POST to /auth/logout with refresh token and clear session', () => {
      localStorage.setItem('access_token', 'access-token-123');
      localStorage.setItem('refresh_token', 'refresh-token-456');
      service.setCurrentUser(mockUser);

      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'refresh-token-456' });
      req.flush(null);

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
      expect(service.currentUser()).toBeNull();
    });

    it('should navigate to /admin/login when area is 1', () => {
      service.setCurrentUser(mockUser); // loginArea: 1
      localStorage.setItem('refresh_token', 'tok');
      service.logout();
      httpMock.expectOne(`${environment.apiUrl}/auth/logout`).flush(null);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/login']);
    });

    it('should navigate to /app/login when area is 2', () => {
      service.setCurrentUser({ ...mockUser, loginArea: 2 });
      localStorage.setItem('refresh_token', 'tok');
      service.logout();
      httpMock.expectOne(`${environment.apiUrl}/auth/logout`).flush(null);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/app/login']);
    });

    it('should not call logout endpoint if no refresh token', () => {
      service.logout();
      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);
      expect(routerSpy.navigate).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should POST to /auth/refresh and update tokens', () => {
      localStorage.setItem('refresh_token', 'old-refresh-token');
      const newResponse = { ...mockLoginResponse, accessToken: 'new-access', refreshToken: 'new-refresh' };

      service.refresh().subscribe(res => {
        expect(res).toEqual(newResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ refreshToken: 'old-refresh-token' });
      req.flush(newResponse);

      expect(localStorage.getItem('access_token')).toBe('new-access');
      expect(localStorage.getItem('refresh_token')).toBe('new-refresh');
      expect(service.token()).toBe('new-access');
    });
  });

  describe('setCurrentUser / hasRole / hasProgram / isAdmin', () => {
    it('should set current user and update computed signals', () => {
      service.setCurrentUser(mockUser);
      expect(service.currentUser()).toEqual(mockUser);
      expect(service.isAdmin()).toBeTrue();
    });

    it('hasRole should return true for existing role', () => {
      service.setCurrentUser(mockUser);
      expect(service.hasRole('SuperAdmin')).toBeTrue();
    });

    it('hasRole should return false for non-existing role', () => {
      service.setCurrentUser(mockUser);
      expect(service.hasRole('User')).toBeFalse();
    });

    it('hasProgram should return true for assigned program', () => {
      service.setCurrentUser(mockUser);
      expect(service.hasProgram('GESTIONE_ORDINI')).toBeTrue();
    });

    it('hasProgram should return false for non-assigned program', () => {
      service.setCurrentUser(mockUser);
      expect(service.hasProgram('ALTRO_PROGRAMMA')).toBeFalse();
    });

    it('isAdmin should be false for non-admin roles', () => {
      service.setCurrentUser({ ...mockUser, roles: ['User'] });
      expect(service.isAdmin()).toBeFalse();
    });

    it('isAdmin should be true for Admin role', () => {
      service.setCurrentUser({ ...mockUser, roles: ['Admin'] });
      expect(service.isAdmin()).toBeTrue();
    });
  });
});
