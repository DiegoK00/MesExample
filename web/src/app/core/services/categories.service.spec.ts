import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CategoriesService } from './categories.service';
import { environment } from '../../../environments/environment';
import { CategoryResponse } from '../models/article.models';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;

  const mockCategory: CategoryResponse = {
    id: 1,
    name: 'Abbigliamento',
    description: 'Categoria abbigliamento'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CategoriesService]
    });
    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getAll', () => {
    it('should GET /categories', () => {
      service.getAll().subscribe(res => expect(res).toEqual([mockCategory]));

      const req = httpMock.expectOne(`${environment.apiUrl}/categories`);
      expect(req.request.method).toBe('GET');
      req.flush([mockCategory]);
    });
  });

  describe('getById', () => {
    it('should GET /categories/:id', () => {
      service.getById(1).subscribe(res => expect(res).toEqual(mockCategory));

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCategory);
    });
  });

  describe('create', () => {
    it('should POST /categories with create request', () => {
      const createReq = { name: 'Elettronica', description: 'Prodotti elettronici' };
      service.create(createReq).subscribe(res => expect(res).toEqual(mockCategory));

      const req = httpMock.expectOne(`${environment.apiUrl}/categories`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createReq);
      req.flush(mockCategory);
    });
  });

  describe('update', () => {
    it('should PUT /categories/:id with update request', () => {
      const updateReq = { name: 'Nome Aggiornato', description: 'Nuova descrizione' };
      service.update(1, updateReq).subscribe(res => expect(res).toEqual(mockCategory));

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateReq);
      req.flush(mockCategory);
    });
  });

  describe('delete', () => {
    it('should DELETE /categories/:id', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/categories/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
