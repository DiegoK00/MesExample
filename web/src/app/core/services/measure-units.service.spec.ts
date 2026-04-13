import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MeasureUnitsService } from './measure-units.service';
import { environment } from '../../../environments/environment';
import { MeasureUnitResponse } from '../models/article.models';

describe('MeasureUnitsService', () => {
  let service: MeasureUnitsService;
  let httpMock: HttpTestingController;

  const mockUnit: MeasureUnitResponse = {
    id: 1,
    name: 'PZ',
    description: 'Pezzi'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MeasureUnitsService]
    });
    service = TestBed.inject(MeasureUnitsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getAll', () => {
    it('should GET /measure-units', () => {
      service.getAll().subscribe(res => expect(res).toEqual([mockUnit]));

      const req = httpMock.expectOne(`${environment.apiUrl}/measure-units`);
      expect(req.request.method).toBe('GET');
      req.flush([mockUnit]);
    });
  });

  describe('getById', () => {
    it('should GET /measure-units/:id', () => {
      service.getById(1).subscribe(res => expect(res).toEqual(mockUnit));

      const req = httpMock.expectOne(`${environment.apiUrl}/measure-units/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUnit);
    });
  });

  describe('create', () => {
    it('should POST /measure-units with create request', () => {
      const createReq = { name: 'KG', description: 'Chilogrammi' };
      service.create(createReq).subscribe(res => expect(res).toEqual(mockUnit));

      const req = httpMock.expectOne(`${environment.apiUrl}/measure-units`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createReq);
      req.flush(mockUnit);
    });
  });

  describe('update', () => {
    it('should PUT /measure-units/:id with update request', () => {
      const updateReq = { name: 'PEZZI', description: 'Numero di pezzi' };
      service.update(1, updateReq).subscribe(res => expect(res).toEqual(mockUnit));

      const req = httpMock.expectOne(`${environment.apiUrl}/measure-units/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateReq);
      req.flush(mockUnit);
    });
  });

  describe('delete', () => {
    it('should DELETE /measure-units/:id', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/measure-units/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
