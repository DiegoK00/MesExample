import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, CurrentUser, LoginArea } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;

  private _currentUser = signal<CurrentUser | null>(null);
  private _token = signal<string | null>(this.getStoredToken());

  readonly currentUser = this._currentUser.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._currentUser()?.roles.includes('Admin') || this._currentUser()?.roles.includes('SuperAdmin') || false);

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, request).pipe(
      tap(res => {
        this.storeTokens(res.accessToken, res.refreshToken);
        this._token.set(res.accessToken);
      })
    );
  }

  logout(): void {
    const refreshToken = this.getStoredRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.api}/logout`, { refreshToken }).subscribe();
    }
    this.clearSession();
    const area = this._currentUser()?.loginArea;
    this._currentUser.set(null);
    this._token.set(null);
    this.router.navigate([area === 1 ? '/admin/login' : '/app/login']);
  }

  refresh(): Observable<LoginResponse> {
    const refreshToken = this.getStoredRefreshToken() ?? '';
    return this.http.post<LoginResponse>(`${this.api}/refresh`, { refreshToken }).pipe(
      tap(res => {
        this.storeTokens(res.accessToken, res.refreshToken);
        this._token.set(res.accessToken);
      })
    );
  }

  setCurrentUser(user: CurrentUser): void {
    this._currentUser.set(user);
  }

  forgotPassword(email: string, area: LoginArea): Observable<void> {
    return this.http.post<void>(`${this.api}/forgot-password`, { email, area });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.api}/reset-password`, { token, newPassword });
  }

  hasRole(role: string): boolean {
    return this._currentUser()?.roles.includes(role) ?? false;
  }

  hasProgram(code: string): boolean {
    return this._currentUser()?.programs.includes(code) ?? false;
  }

  private storeTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  private clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getStoredRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }
}
