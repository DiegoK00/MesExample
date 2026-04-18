import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { BillOfMaterialsComponent } from './bill-of-materials.component';
import { BillOfMaterialsService } from '../../../core/services/bill-of-materials.service';
import { ArticlesService } from '../../../core/services/articles.service';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BillOfMaterialResponse, ArticleResponse } from '../../../core/models/article.models';

describe('BillOfMaterialsComponent', () => {
  let fixture: ComponentFixture<BillOfMaterialsComponent>;
  let component: BillOfMaterialsComponent;
  let compiled: HTMLElement;
  let bomServiceSpy: jasmine.SpyObj<BillOfMaterialsService>;
  let articlesServiceSpy: jasmine.SpyObj<ArticlesService>;
  let unitsServiceSpy: jasmine.SpyObj<MeasureUnitsService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockArticle: ArticleResponse = {
    id: 1,
    code: 'PAR001',
    name: 'Articolo Padre',
    description: null,
    categoryId: 1,
    categoryName: 'Categoria',
    price: 100,
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

  const mockBOMs: BillOfMaterialResponse[] = [
    {
      parentArticleId: 1,
      parentArticleCode: 'PAR001',
      parentArticleName: 'Articolo Padre',
      componentArticleId: 2,
      componentArticleCode: 'COMP001',
      componentArticleName: 'Componente 1',
      quantity: 5,
      quantityType: 'PHYSICAL',
      umId: 1,
      umName: 'PZ',
      scrapPercentage: 10,
      scrapFactor: 0,
      fixedScrap: 0
    },
    {
      parentArticleId: 1,
      parentArticleCode: 'PAR001',
      parentArticleName: 'Articolo Padre',
      componentArticleId: 3,
      componentArticleCode: 'COMP002',
      componentArticleName: 'Componente 2',
      quantity: 50,
      quantityType: 'PERCENTAGE',
      umId: 1,
      umName: 'PZ',
      scrapPercentage: 0,
      scrapFactor: 1.1,
      fixedScrap: 0
    }
  ];

  beforeEach(async () => {
    bomServiceSpy = jasmine.createSpyObj('BillOfMaterialsService', ['getByParentArticle', 'delete']);
    bomServiceSpy.getByParentArticle.and.returnValue(of(mockBOMs));
    bomServiceSpy.delete.and.returnValue(of(void 0));

    articlesServiceSpy = jasmine.createSpyObj('ArticlesService', ['getById']);
    articlesServiceSpy.getById.and.returnValue(of(mockArticle));

    unitsServiceSpy = jasmine.createSpyObj('MeasureUnitsService', ['getAll']);
    unitsServiceSpy.getAll.and.returnValue(of([]));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [BillOfMaterialsComponent, NoopAnimationsModule],
      providers: [
        { provide: BillOfMaterialsService, useValue: bomServiceSpy },
        { provide: ArticlesService, useValue: articlesServiceSpy },
        { provide: MeasureUnitsService, useValue: unitsServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    })
      .overrideProvider(MatDialog, { useValue: dialogSpy })
      .overrideProvider(MatSnackBar, { useValue: snackBarSpy })
      .compileComponents();

    fixture = TestBed.createComponent(BillOfMaterialsComponent);
    fixture.componentRef.setInput('parentArticleId', 1);
    component = fixture.componentInstance;
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  describe('Component initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load data on init', () => {
      fixture.detectChanges();
      expect(bomServiceSpy.getByParentArticle).toHaveBeenCalledWith(component.parentArticleId());
      expect(articlesServiceSpy.getById).toHaveBeenCalledWith(component.parentArticleId());
    });

    it('should display parent article code in header', () => {
      fixture.detectChanges();
      expect(compiled.textContent).toContain('PAR001');
    });
  });

  describe('Data loading', () => {
    it('mostra loading spinner durante il caricamento', () => {
      component.loading.set(true);
      fixture.detectChanges();
      const spinner = compiled.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('mostra la tabella dopo il caricamento', () => {
      component.boms.set(mockBOMs);
      component.loading.set(false);
      fixture.detectChanges();
      const table = compiled.querySelector('table');
      expect(table).toBeTruthy();
    });

    it('mostra i BOM nella tabella', () => {
      component.boms.set(mockBOMs);
      fixture.detectChanges();
      const rows = compiled.querySelectorAll('tr[mat-row]');
      expect(rows.length).toBe(2);
    });

    it('mostra il codice componente', () => {
      component.boms.set(mockBOMs);
      fixture.detectChanges();
      expect(compiled.textContent).toContain('COMP001');
      expect(compiled.textContent).toContain('COMP002');
    });

    it('mostra il nome componente', () => {
      component.boms.set(mockBOMs);
      fixture.detectChanges();
      expect(compiled.textContent).toContain('Componente 1');
      expect(compiled.textContent).toContain('Componente 2');
    });

    it('mostra la quantità e il tipo di quantità', () => {
      component.boms.set(mockBOMs);
      fixture.detectChanges();
      expect(compiled.textContent).toContain('PHYSICAL');
      expect(compiled.textContent).toContain('PERCENTAGE');
    });

    it('mostra l\'unità di misura', () => {
      component.boms.set(mockBOMs);
      fixture.detectChanges();
      expect(compiled.textContent).toContain('PZ');
    });

    it('mostra il messaggio "Nessun componente trovato" quando non ci sono BOMs', () => {
      component.boms.set([]);
      fixture.detectChanges();
      expect(compiled.textContent).toContain('Nessun componente trovato');
    });
  });

  describe('Scrap display', () => {
    it('mostra il scrap percentage', () => {
      component.boms.set([mockBOMs[0]]);
      fixture.detectChanges();
      expect(compiled.textContent).toContain('10%');
    });

    it('mostra il scrap factor', () => {
      component.boms.set([mockBOMs[1]]);
      fixture.detectChanges();
      expect(compiled.textContent).toContain('F:');
    });

    it('mostra il trattino quando non ci sono scrap', () => {
      const noscrapBOM = { ...mockBOMs[0], scrapPercentage: 0, scrapFactor: 0, fixedScrap: 0 };
      component.boms.set([noscrapBOM]);
      fixture.detectChanges();
      expect(compiled.textContent).toContain('—');
    });
  });

  describe('Dialog interactions', () => {
    it('openCreateDialog() apre il dialog di creazione', () => {
      component.openCreateDialog();
      expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        data: { parentArticleId: component.parentArticleId() }
      }));
    });

    it('openEditDialog() apre il dialog di modifica', () => {
      component.openEditDialog(mockBOMs[0]);
      expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
        data: { parentArticleId: component.parentArticleId(), bom: mockBOMs[0] }
      }));
    });

    it('dopo il dialog di creazione, mostra snackbar di successo e ricarica i dati', (done) => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.openCreateDialog();
      setTimeout(() => {
        expect(snackBarSpy.open).toHaveBeenCalledWith('Componente aggiunto', 'OK', { duration: 2000 });
        expect(bomServiceSpy.getByParentArticle).toHaveBeenCalled();
        done();
      });
    });

    it('dopo il dialog di modifica, mostra snackbar di successo e ricarica i dati', (done) => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.openEditDialog(mockBOMs[0]);
      setTimeout(() => {
        expect(snackBarSpy.open).toHaveBeenCalledWith('Componente aggiornato', 'OK', { duration: 2000 });
        expect(bomServiceSpy.getByParentArticle).toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Delete functionality', () => {
    it('delete() chiede conferma prima di eliminare', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.delete(mockBOMs[0]);
      expect(bomServiceSpy.delete).not.toHaveBeenCalled();
    });

    it('delete() elimina il BOM dopo conferma', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.delete(mockBOMs[0]);
      expect(bomServiceSpy.delete).toHaveBeenCalledWith(1, 2);
    });

    it('dopo eliminazione, mostra snackbar di successo', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.delete(mockBOMs[0]);
      setTimeout(() => {
        expect(snackBarSpy.open).toHaveBeenCalledWith('Componente eliminato', 'OK', { duration: 2000 });
        done();
      });
    });

    it('in caso di errore, mostra snackbar di errore', (done) => {
      spyOn(window, 'confirm').and.returnValue(true);
      bomServiceSpy.delete.and.returnValue(throwError(() => ({ error: { title: 'Errore custom' } })));
      component.delete(mockBOMs[0]);
      setTimeout(() => {
        expect(snackBarSpy.open).toHaveBeenCalledWith('Errore custom', 'OK', { duration: 3000 });
        done();
      });
    });
  });

  describe('Navigation', () => {
    it('goBack() naviga alle articles', () => {
      component.goBack();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin/articles']);
    });
  });

  describe('Error handling', () => {
    it('mostra snackbar di errore se il caricamento fallisce', (done) => {
      articlesServiceSpy.getById.and.returnValue(throwError(() => new Error('API error')));
      component.loadData();
      setTimeout(() => {
        expect(snackBarSpy.open).toHaveBeenCalledWith('Errore nel caricamento', 'OK', { duration: 3000 });
        expect(component.loading()).toBeFalse();
        done();
      });
    });
  });

  describe('Column structure', () => {
    it('ha le colonne corrette', () => {
      expect(component.columns).toEqual(['componentCode', 'componentName', 'quantity', 'scrap', 'actions']);
    });
  });
});
