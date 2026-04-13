import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ArticleResponse, CreateArticleRequest, UpdateArticleRequest } from '../models/article.models';

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private readonly api = `${environment.apiUrl}/articles`;

  constructor(private http: HttpClient) {}

  getAll(activeOnly?: boolean): Observable<ArticleResponse[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined) params = params.set('activeOnly', activeOnly);
    return this.http.get<ArticleResponse[]>(this.api, { params });
  }

  getById(id: number): Observable<ArticleResponse> {
    return this.http.get<ArticleResponse>(`${this.api}/${id}`);
  }

  create(request: CreateArticleRequest): Observable<ArticleResponse> {
    return this.http.post<ArticleResponse>(this.api, request);
  }

  update(id: number, request: UpdateArticleRequest): Observable<ArticleResponse> {
    return this.http.put<ArticleResponse>(`${this.api}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
