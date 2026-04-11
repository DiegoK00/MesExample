import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserResponse, UsersPageResponse, CreateUserRequest, UpdateUserRequest } from '../models/user.models';
import { UserProgramResponse } from '../models/program.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly api = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, pageSize = 20, search?: string): Observable<UsersPageResponse> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<UsersPageResponse>(this.api, { params });
  }

  getById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.api}/${id}`);
  }

  create(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(this.api, request);
  }

  update(id: number, request: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.api}/${id}`, request);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  getUserPrograms(userId: number): Observable<UserProgramResponse[]> {
    return this.http.get<UserProgramResponse[]>(`${this.api}/${userId}/programs`);
  }

  assignPrograms(userId: number, programIds: number[]): Observable<UserProgramResponse[]> {
    return this.http.post<UserProgramResponse[]>(`${this.api}/${userId}/programs`, { programIds });
  }

  revokePrograms(userId: number, programIds: number[]): Observable<void> {
    return this.http.delete<void>(`${this.api}/${userId}/programs`, { body: { programIds } });
  }
}
