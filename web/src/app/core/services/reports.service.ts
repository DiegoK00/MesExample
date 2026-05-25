import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TopArticleResponse, ProductionKpiResponse } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly api = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getTopArticles(top = 10): Observable<TopArticleResponse[]> {
    return this.http.get<TopArticleResponse[]>(`${this.api}/articles/top-used`, {
      params: new HttpParams().set('top', top)
    });
  }

  getProductionKpi(): Observable<ProductionKpiResponse> {
    return this.http.get<ProductionKpiResponse>(`${this.api}/production/kpi`);
  }

  exportTopArticlesPdf(top = 10): Observable<Blob> {
    return this.http.get(`${this.api}/articles/top-used/export/pdf`, {
      params: new HttpParams().set('top', top),
      responseType: 'blob'
    });
  }

  exportTopArticlesExcel(top = 10): Observable<Blob> {
    return this.http.get(`${this.api}/articles/top-used/export/excel`, {
      params: new HttpParams().set('top', top),
      responseType: 'blob'
    });
  }

  exportKpiExcel(): Observable<Blob> {
    return this.http.get(`${this.api}/production/kpi/export/excel`, { responseType: 'blob' });
  }
}
