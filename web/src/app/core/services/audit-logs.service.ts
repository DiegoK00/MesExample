import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuditLogsPageResponse } from '../models/audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogsService {
  private readonly api = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  getLogs(params: {
    page?: number;
    pageSize?: number;
    userId?: number;
    action?: string;
    entityName?: string;
    from?: string;
    to?: string;
  }): Observable<AuditLogsPageResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('pageSize', params.pageSize ?? 50);

    if (params.userId) httpParams = httpParams.set('userId', params.userId);
    if (params.action) httpParams = httpParams.set('action', params.action);
    if (params.entityName) httpParams = httpParams.set('entityName', params.entityName);
    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);

    return this.http.get<AuditLogsPageResponse>(this.api, { params: httpParams });
  }
}
