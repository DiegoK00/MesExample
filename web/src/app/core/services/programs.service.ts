import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProgramResponse, CreateProgramRequest, UpdateProgramRequest } from '../models/program.models';

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  private readonly api = `${environment.apiUrl}/programs`;

  constructor(private http: HttpClient) {}

  getAll(activeOnly?: boolean): Observable<ProgramResponse[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined) params = params.set('activeOnly', activeOnly);
    return this.http.get<ProgramResponse[]>(this.api, { params });
  }

  getById(id: number): Observable<ProgramResponse> {
    return this.http.get<ProgramResponse>(`${this.api}/${id}`);
  }

  create(request: CreateProgramRequest): Observable<ProgramResponse> {
    return this.http.post<ProgramResponse>(this.api, request);
  }

  update(id: number, request: UpdateProgramRequest): Observable<ProgramResponse> {
    return this.http.put<ProgramResponse>(`${this.api}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
