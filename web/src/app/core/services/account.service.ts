import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentUser } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly api = `${environment.apiUrl}/account`;

  constructor(private http: HttpClient) {}

  getMe(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.api}/me`);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.api}/password`, { currentPassword, newPassword });
  }
}
