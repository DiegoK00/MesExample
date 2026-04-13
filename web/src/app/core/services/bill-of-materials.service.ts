import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BillOfMaterialResponse, CreateBillOfMaterialRequest, UpdateBillOfMaterialRequest } from '../models/article.models';

@Injectable({ providedIn: 'root' })
export class BillOfMaterialsService {
  private readonly api = `${environment.apiUrl}/bill-of-materials`;

  constructor(private http: HttpClient) {}

  getByParentArticle(parentArticleId: number): Observable<BillOfMaterialResponse[]> {
    return this.http.get<BillOfMaterialResponse[]>(`${this.api}/by-parent/${parentArticleId}`);
  }

  get(parentArticleId: number, componentArticleId: number): Observable<BillOfMaterialResponse> {
    return this.http.get<BillOfMaterialResponse>(`${this.api}/${parentArticleId}/${componentArticleId}`);
  }

  create(request: CreateBillOfMaterialRequest): Observable<BillOfMaterialResponse> {
    return this.http.post<BillOfMaterialResponse>(this.api, request);
  }

  update(parentArticleId: number, componentArticleId: number, request: UpdateBillOfMaterialRequest): Observable<BillOfMaterialResponse> {
    return this.http.put<BillOfMaterialResponse>(`${this.api}/${parentArticleId}/${componentArticleId}`, request);
  }

  delete(parentArticleId: number, componentArticleId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${parentArticleId}/${componentArticleId}`);
  }
}
