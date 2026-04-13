import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BillOfMaterialsService } from './bill-of-materials.service';
import { environment } from '../../../environments/environment';
import { BillOfMaterialResponse, CreateBillOfMaterialRequest, UpdateBillOfMaterialRequest } from '../models/article.models';

describe('BillOfMaterialsService', () => {
  let service: BillOfMaterialsService;
  let httpMock: HttpTestingController;

  const mockBOM: BillOfMaterialResponse = {
    parentArticleId: 1,
    parentArticleCode: 'PAR001',
    parentArticleName: 'Articolo Padre',
    componentArticleId: 2,
    componentArticleCode: 'COMP001',
    componentArticleName: 'Componente',
    quantity: 5,
    quantityType: 'PHYSICAL',
    umId: 1,
    umName: 'PZ',
    scrapPercentage: 10,
    scrapFactor: 0,
    fixedScrap: 0
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BillOfMaterialsService]
    });
    service = TestBed.inject(BillOfMaterialsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getByParentArticle', () => {
    it('should GET /bill-of-materials/by-parent/:id', () => {
      service.getByParentArticle(1).subscribe(res => expect(res).toEqual([mockBOM]));

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials/by-parent/1`);
      expect(req.request.method).toBe('GET');
      req.flush([mockBOM]);
    });

    it('should handle empty list', () => {
      service.getByParentArticle(999).subscribe(res => expect(res).toEqual([]));

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials/by-parent/999`);
      req.flush([]);
    });

    it('should return multiple BOMs sorted', () => {
      const bom2 = { ...mockBOM, componentArticleId: 3, componentArticleCode: 'COMP002' };
      service.getByParentArticle(1).subscribe(res => expect(res.length).toBe(2));

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials/by-parent/1`);
      req.flush([mockBOM, bom2]);
    });
  });

  describe('get', () => {
    it('should GET /bill-of-materials/:parentId/:componentId', () => {
      service.get(1, 2).subscribe(res => expect(res).toEqual(mockBOM));

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials/1/2`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBOM);
    });
  });

  describe('create', () => {
    it('should POST /bill-of-materials with create request', () => {
      const createReq: CreateBillOfMaterialRequest = {
        parentArticleId: 1,
        componentArticleId: 2,
        quantity: 5,
        quantityType: 'PHYSICAL',
        umId: 1,
        scrapPercentage: 10,
        scrapFactor: 0,
        fixedScrap: 0
      };
      service.create(createReq).subscribe(res => expect(res).toEqual(mockBOM));

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createReq);
      req.flush(mockBOM);
    });

    it('should POST with PERCENTAGE quantity type', () => {
      const createReq: CreateBillOfMaterialRequest = {
        parentArticleId: 1,
        componentArticleId: 2,
        quantity: 50,
        quantityType: 'PERCENTAGE',
        umId: 1,
        scrapPercentage: 0,
        scrapFactor: 1.05,
        fixedScrap: 0
      };
      service.create(createReq).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials`);
      expect(req.request.body.quantityType).toBe('PERCENTAGE');
      expect(req.request.body.scrapFactor).toBe(1.05);
      req.flush(mockBOM);
    });

    it('should POST with all scrap types', () => {
      const createReq: CreateBillOfMaterialRequest = {
        parentArticleId: 1,
        componentArticleId: 2,
        quantity: 5,
        quantityType: 'PHYSICAL',
        umId: 1,
        scrapPercentage: 5,
        scrapFactor: 1.1,
        fixedScrap: 2
      };
      service.create(createReq).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials`);
      expect(req.request.body.scrapPercentage).toBe(5);
      expect(req.request.body.scrapFactor).toBe(1.1);
      expect(req.request.body.fixedScrap).toBe(2);
      req.flush(mockBOM);
    });
  });

  describe('update', () => {
    it('should PUT /bill-of-materials/:parentId/:componentId with update request', () => {
      const updateReq: UpdateBillOfMaterialRequest = {
        quantity: 10,
        quantityType: 'PERCENTAGE' as const,
        umId: 2,
        scrapPercentage: 20,
        scrapFactor: 0,
        fixedScrap: 0
      };
      const updatedBOM: BillOfMaterialResponse = { ...mockBOM, quantity: 10, quantityType: 'PERCENTAGE' };
      service.update(1, 2, updateReq).subscribe(res => expect(res).toEqual(updatedBOM));

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials/1/2`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateReq);
      req.flush(updatedBOM);
    });

    it('should update only scrap fields', () => {
      const updateReq: UpdateBillOfMaterialRequest = {
        quantity: 5,
        quantityType: 'PHYSICAL',
        umId: 1,
        scrapPercentage: 0,
        scrapFactor: 1.15,
        fixedScrap: 3
      };
      service.update(1, 2, updateReq).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials/1/2`);
      expect(req.request.body.scrapFactor).toBe(1.15);
      expect(req.request.body.fixedScrap).toBe(3);
      req.flush(mockBOM);
    });
  });

  describe('delete', () => {
    it('should DELETE /bill-of-materials/:parentId/:componentId', () => {
      service.delete(1, 2).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/bill-of-materials/1/2`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });
});
