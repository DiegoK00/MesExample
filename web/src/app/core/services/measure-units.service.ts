import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MeasureUnitResponse, CreateMeasureUnitRequest, UpdateMeasureUnitRequest } from '../models/article.models';

@Injectable({ providedIn: 'root' })
export class MeasureUnitsService {
  private readonly api = `${environment.apiUrl}/measure-units`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<MeasureUnitResponse[]> {
    return this.http.get<MeasureUnitResponse[]>(this.api);
  }

  getById(id: number): Observable<MeasureUnitResponse> {
    return this.http.get<MeasureUnitResponse>(`${this.api}/${id}`);
  }

  create(request: CreateMeasureUnitRequest): Observable<MeasureUnitResponse> {
    return this.http.post<MeasureUnitResponse>(this.api, request);
  }

  update(id: number, request: UpdateMeasureUnitRequest): Observable<MeasureUnitResponse> {
    return this.http.put<MeasureUnitResponse>(`${this.api}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
