import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockLoginResponse = {
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token',
    expiresAt: '2026-03-30T00:00:00Z'
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['token', 'refresh', 'logout'], {
      token: jasmine.createSpy().and.returnValue(null)
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should add Authorization header when token is present', () => {
    authServiceSpy.token.and.returnValue('my-access-token');

    http.get('/api/users').subscribe();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-access-token');
    req.flush([]);
  });

  it('should not add Authorization header when no token', () => {
    authServiceSpy.token.and.returnValue(null);

    http.get('/api/users').subscribe();

    const req = httpMock.expectOne('/api/users');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should refresh token and retry request on 401 (non-auth endpoint)', (done) => {
    authServiceSpy.token.and.returnValue('expired-token');
    authServiceSpy.refresh.and.returnValue(of(mockLoginResponse));

    http.get('/api/users').subscribe({
      next: res => {
        expect(res).toEqual({ data: 'ok' });
        done();
      }
    });

    // Prima richiesta → 401
    const firstReq = httpMock.expectOne('/api/users');
    firstReq.flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    // Retry con nuovo token
    const retryReq = httpMock.expectOne('/api/users');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-access-token');
    retryReq.flush({ data: 'ok' });
  });

  it('should call logout and throw error when refresh fails on 401', (done) => {
    authServiceSpy.token.and.returnValue('expired-token');
    authServiceSpy.refresh.and.returnValue(throwError(() => new Error('Refresh failed')));

    http.get('/api/users').subscribe({
      error: err => {
        expect(authServiceSpy.logout).toHaveBeenCalled();
        expect(err).toBeTruthy();
        done();
      }
    });

    const req = httpMock.expectOne('/api/users');
    req.flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should NOT refresh token on 401 for auth endpoints', (done) => {
    authServiceSpy.token.and.returnValue('expired-token');

    http.get('/api/auth/me').subscribe({
      error: err => {
        expect(err.status).toBe(401);
        expect(authServiceSpy.refresh).not.toHaveBeenCalled();
        done();
      }
    });

    const req = httpMock.expectOne('/api/auth/me');
    req.flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
  });

  it('should propagate non-401 errors without refreshing', (done) => {
    authServiceSpy.token.and.returnValue('valid-token');

    http.get('/api/users').subscribe({
      error: err => {
        expect(err.status).toBe(403);
        expect(authServiceSpy.refresh).not.toHaveBeenCalled();
        done();
      }
    });

    const req = httpMock.expectOne('/api/users');
    req.flush({ title: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
  });
});
