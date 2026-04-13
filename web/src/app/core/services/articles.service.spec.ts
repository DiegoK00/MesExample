import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ArticlesService } from './articles.service';
import { environment } from '../../../environments/environment';
import { ArticleResponse } from '../models/article.models';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let httpMock: HttpTestingController;

  const mockArticle: ArticleResponse = {
    id: 1,
    code: 'ART001',
    name: 'Articolo Test',
    description: null,
    categoryId: 1,
    categoryName: 'Abbigliamento',
    price: 15.99,
    umId: 1,
    umName: 'PZ',
    um2Id: null,
    um2Name: null,
    measures: null,
    composition: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    createdByUsername: 'admin',
    deletedAt: null,
    deletedByUsername: null
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ArticlesService]
    });
    service = TestBed.inject(ArticlesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getAll', () => {
    it('should GET /articles without params when activeOnly is not provided', () => {
      service.getAll().subscribe(res => expect(res).toEqual([mockArticle]));

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/articles`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('activeOnly')).toBeFalse();
      req.flush([mockArticle]);
    });

    it('should include activeOnly=true param when true', () => {
      service.getAll(true).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/articles`);
      expect(req.request.params.get('activeOnly')).toBe('true');
      req.flush([mockArticle]);
    });

    it('should include activeOnly=false param when false', () => {
      service.getAll(false).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/articles`);
      expect(req.request.params.get('activeOnly')).toBe('false');
      req.flush([]);
    });
  });

  describe('getById', () => {
    it('should GET /articles/:id', () => {
      service.getById(1).subscribe(res => expect(res).toEqual(mockArticle));

      const req = httpMock.expectOne(`${environment.apiUrl}/articles/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockArticle);
    });
  });

  describe('create', () => {
    it('should POST /articles with create request', () => {
      const createReq = {
        code: 'NEW001', name: 'Nuovo', categoryId: 1, price: 10, umId: 1
      };
      service.create(createReq).subscribe(res => expect(res).toEqual(mockArticle));

      const req = httpMock.expectOne(`${environment.apiUrl}/articles`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createReq);
      req.flush(mockArticle);
    });
  });

  describe('update', () => {
    it('should PUT /articles/:id with update request', () => {
      const updateReq = {
        name: 'Aggiornato', categoryId: 1, price: 20, umId: 1, isActive: true
      };
      service.update(1, updateReq).subscribe(res => expect(res).toEqual(mockArticle));

      const req = httpMock.expectOne(`${environment.apiUrl}/articles/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateReq);
      req.flush(mockArticle);
    });
  });

  describe('delete', () => {
    it('should DELETE /articles/:id', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/articles/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
