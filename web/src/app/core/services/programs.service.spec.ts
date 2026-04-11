import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProgramsService } from './programs.service';
import { environment } from '../../../environments/environment';
import { ProgramResponse } from '../models/program.models';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let httpMock: HttpTestingController;

  const mockProgram: ProgramResponse = {
    id: 1,
    code: 'GESTIONE_ORDINI',
    name: 'Gestione Ordini',
    description: 'Modulo ordini',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProgramsService]
    });
    service = TestBed.inject(ProgramsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getAll', () => {
    it('should GET /programs without params when activeOnly is not provided', () => {
      service.getAll().subscribe(res => expect(res).toEqual([mockProgram]));

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/programs`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.has('activeOnly')).toBeFalse();
      req.flush([mockProgram]);
    });

    it('should include activeOnly=true param when true', () => {
      service.getAll(true).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/programs`);
      expect(req.request.params.get('activeOnly')).toBe('true');
      req.flush([mockProgram]);
    });

    it('should include activeOnly=false param when false', () => {
      service.getAll(false).subscribe();

      const req = httpMock.expectOne(r => r.url === `${environment.apiUrl}/programs`);
      expect(req.request.params.get('activeOnly')).toBe('false');
      req.flush([]);
    });
  });

  describe('getById', () => {
    it('should GET /programs/:id', () => {
      service.getById(1).subscribe(res => expect(res).toEqual(mockProgram));

      const req = httpMock.expectOne(`${environment.apiUrl}/programs/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProgram);
    });
  });

  describe('create', () => {
    it('should POST /programs with create request', () => {
      const createReq = { code: 'NUOVO_MODULO', name: 'Nuovo Modulo', description: 'Desc' };
      service.create(createReq).subscribe(res => expect(res).toEqual(mockProgram));

      const req = httpMock.expectOne(`${environment.apiUrl}/programs`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createReq);
      req.flush(mockProgram);
    });
  });

  describe('update', () => {
    it('should PUT /programs/:id with update request', () => {
      const updateReq = { name: 'Nome Aggiornato', isActive: true };
      service.update(1, updateReq).subscribe(res => expect(res).toEqual(mockProgram));

      const req = httpMock.expectOne(`${environment.apiUrl}/programs/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateReq);
      req.flush(mockProgram);
    });
  });

  describe('delete', () => {
    it('should DELETE /programs/:id', () => {
      service.delete(1).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/programs/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
