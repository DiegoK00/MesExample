import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { BillOfMaterialDialogComponent } from './bill-of-material-dialog.component';
import { BillOfMaterialsService } from '../../../core/services/bill-of-materials.service';
import { ArticlesService } from '../../../core/services/articles.service';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { ArticleResponse, MeasureUnitResponse, BillOfMaterialResponse } from '../../../core/models/article.models';

describe('BillOfMaterialDialogComponent', () => {
  let bomServiceSpy: jasmine.SpyObj<BillOfMaterialsService>;
  let articlesServiceSpy: jasmine.SpyObj<ArticlesService>;
  let unitsServiceSpy: jasmine.SpyObj<MeasureUnitsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<BillOfMaterialDialogComponent>>;

  const mockArticles: ArticleResponse[] = [
    {
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
      isActive: true,
      measures: null,
      composition: null,
      createdAt: '2026-01-01T00:00:00Z',
      createdByUsername: 'admin',
      deletedAt: null,
      deletedByUsername: null
    },
    {
      id: 2,
      code: 'COMP001',
      name: 'Componente 1',
      description: null,
      categoryId: 1,
      categoryName: 'Categoria',
      price: 10,
      umId: 1,
      umName: 'PZ',
      um2Id: null,
      um2Name: null,
      isActive: true,
      measures: null,
      composition: null,
      createdAt: '2026-01-01T00:00:00Z',
      createdByUsername: 'admin',
      deletedAt: null,
      deletedByUsername: null
    }
  ];

  const mockUnits: MeasureUnitResponse[] = [
    { id: 1, name: 'PZ', description: 'Pezzo' },
    { id: 2, name: 'KG', description: 'Chilogrammo' }
  ];

  const mockBOM: BillOfMaterialResponse = {
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
  };

  function createFixture(dialogData: any): ComponentFixture<BillOfMaterialDialogComponent> {
    TestBed.configureTestingModule({
      imports: [BillOfMaterialDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: BillOfMaterialsService, useValue: bomServiceSpy },
        { provide: ArticlesService, useValue: articlesServiceSpy },
        { provide: MeasureUnitsService, useValue: unitsServiceSpy }
      ]
    }).compileComponents();

    const f = TestBed.createComponent(BillOfMaterialDialogComponent);
    f.detectChanges();
    return f;
  }

  beforeEach(() => {
    bomServiceSpy = jasmine.createSpyObj('BillOfMaterialsService', ['create', 'update']);
    articlesServiceSpy = jasmine.createSpyObj('ArticlesService', ['getAll']);
    unitsServiceSpy = jasmine.createSpyObj('MeasureUnitsService', ['getAll']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    articlesServiceSpy.getAll.and.returnValue(of(mockArticles));
    unitsServiceSpy.getAll.and.returnValue(of(mockUnits));
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('modalità creazione', () => {
    let fixture: ComponentFixture<BillOfMaterialDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({ parentArticleId: 1 });
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Aggiungi Componente"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Aggiungi Componente');
    });

    it('mostra i campi necessari nel form', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).toContain('Articolo Componente');
      expect(labels).toContain('Quantità');
      expect(labels).toContain('Tipo Quantità');
      expect(labels).toContain('Unità di Misura');
    });

    it('mostra la sezione "Gestione Scarto"', () => {
      expect(compiled.textContent).toContain('Gestione Scarto');
    });

    it('esclude l\'articolo padre dalla lista componenti', () => {
      const component = fixture.componentInstance;
      expect(component.articles().length).toBe(1);
      expect(component.articles()[0].id).toBe(2);
    });

    it('il campo componentArticleId non è disabilitato in creazione', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('componentArticleId')?.enabled).toBeTrue();
    });

    it('carica gli articoli e le unità di misura', () => {
      const component = fixture.componentInstance;
      expect(articlesServiceSpy.getAll).toHaveBeenCalled();
      expect(unitsServiceSpy.getAll).toHaveBeenCalled();
      expect(component.articles().length).toBeGreaterThan(0);
      expect(component.units().length).toBeGreaterThan(0);
    });

    it('il bottone mostra "Crea"', () => {
      fixture.detectChanges();
      const button = compiled.querySelector('[mat-raised-button]');
      expect(button?.textContent).toContain('Crea');
    });
  });

  describe('modalità modifica', () => {
    let fixture: ComponentFixture<BillOfMaterialDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({ parentArticleId: 1, bom: mockBOM });
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Modifica Componente"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Modifica Componente');
    });

    it('il campo componentArticleId è disabilitato in modifica', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('componentArticleId')?.disabled).toBeTrue();
    });

    it('popola il form con i valori del BOM', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('componentArticleId')?.value).toBe(mockBOM.componentArticleId);
      expect(component.form.get('quantity')?.value).toBe(mockBOM.quantity);
      expect(component.form.get('quantityType')?.value).toBe(mockBOM.quantityType);
      expect(component.form.get('umId')?.value).toBe(mockBOM.umId);
      expect(component.form.get('scrapPercentage')?.value).toBe(mockBOM.scrapPercentage);
    });

    it('il bottone mostra "Aggiorna"', () => {
      fixture.detectChanges();
      const button = compiled.querySelector('[mat-raised-button]');
      expect(button?.textContent).toContain('Aggiorna');
    });
  });

  describe('Validazione campi', () => {
    let fixture: ComponentFixture<BillOfMaterialDialogComponent>;
    let component: BillOfMaterialDialogComponent;

    beforeEach(() => {
      fixture = createFixture({ parentArticleId: 1 });
      component = fixture.componentInstance;
    });

    it('componentArticleId è obbligatorio', () => {
      component.form.get('componentArticleId')?.setValue(null);
      expect(component.form.get('componentArticleId')?.hasError('required')).toBeTrue();
    });

    it('quantity è obbligatorio', () => {
      component.form.get('quantity')?.setValue(null);
      expect(component.form.get('quantity')?.hasError('required')).toBeTrue();
    });

    it('quantity deve essere >= 0.0001', () => {
      component.form.get('quantity')?.setValue(0);
      expect(component.form.get('quantity')?.hasError('min')).toBeTrue();
    });

    it('quantityType è obbligatorio', () => {
      component.form.get('quantityType')?.setValue(null);
      expect(component.form.get('quantityType')?.hasError('required')).toBeTrue();
    });

    it('umId è obbligatorio', () => {
      component.form.get('umId')?.setValue(null);
      expect(component.form.get('umId')?.hasError('required')).toBeTrue();
    });

    it('scrapPercentage deve essere tra 0 e 100', () => {
      component.form.get('scrapPercentage')?.setValue(101);
      expect(component.form.get('scrapPercentage')?.hasError('max')).toBeTrue();
      component.form.get('scrapPercentage')?.setValue(-1);
      expect(component.form.get('scrapPercentage')?.hasError('min')).toBeTrue();
    });

    it('scrapFactor deve essere tra 0 e 1', () => {
      component.form.get('scrapFactor')?.setValue(1.1);
      expect(component.form.get('scrapFactor')?.hasError('max')).toBeTrue();
      component.form.get('scrapFactor')?.setValue(-0.1);
      expect(component.form.get('scrapFactor')?.hasError('min')).toBeTrue();
    });

    it('fixedScrap deve essere >= 0', () => {
      component.form.get('fixedScrap')?.setValue(-1);
      expect(component.form.get('fixedScrap')?.hasError('min')).toBeTrue();
    });
  });

  describe('Save in creazione', () => {
    let fixture: ComponentFixture<BillOfMaterialDialogComponent>;
    let component: BillOfMaterialDialogComponent;

    beforeEach(() => {
      fixture = createFixture({ parentArticleId: 1 });
      component = fixture.componentInstance;
      bomServiceSpy.create.and.returnValue(of(mockBOM));
    });

    it('chiama bomService.create con i dati corretti', () => {
      component.form.patchValue({
        componentArticleId: 2,
        quantity: 5,
        quantityType: 'PHYSICAL',
        umId: 1,
        scrapPercentage: 10
      });
      component.save();
      expect(bomServiceSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
        parentArticleId: 1,
        componentArticleId: 2,
        quantity: 5,
        quantityType: 'PHYSICAL',
        umId: 1,
        scrapPercentage: 10
      }));
    });

    it('chiude il dialog con true se creazione riuscisce', () => {
      component.form.patchValue({
        componentArticleId: 2,
        quantity: 5,
        quantityType: 'PHYSICAL',
        umId: 1
      });
      component.save();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('mostra l\'errore se creazione fallisce', (done) => {
      bomServiceSpy.create.and.returnValue(throwError(() => ({ error: { title: 'Errore creazione' } })));
      component.form.patchValue({
        componentArticleId: 2,
        quantity: 5,
        quantityType: 'PHYSICAL',
        umId: 1
      });
      component.save();
      setTimeout(() => {
        expect(component.errorMsg()).toBe('Errore creazione');
        expect(dialogRefSpy.close).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Save in modifica', () => {
    let fixture: ComponentFixture<BillOfMaterialDialogComponent>;
    let component: BillOfMaterialDialogComponent;

    beforeEach(() => {
      fixture = createFixture({ parentArticleId: 1, bom: mockBOM });
      component = fixture.componentInstance;
      bomServiceSpy.update.and.returnValue(of(mockBOM));
    });

    it('chiama bomService.update con i dati corretti', () => {
      component.form.patchValue({
        quantity: 10,
        scrapPercentage: 20
      });
      component.save();
      expect(bomServiceSpy.update).toHaveBeenCalledWith(
        1,
        2,
        jasmine.objectContaining({
          quantity: 10,
          quantityType: 'PHYSICAL',
          umId: 1,
          scrapPercentage: 20
        })
      );
    });

    it('chiude il dialog con true se aggiornamento riuscisce', () => {
      component.form.patchValue({ quantity: 10 });
      component.save();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('mostra l\'errore se aggiornamento fallisce', (done) => {
      bomServiceSpy.update.and.returnValue(throwError(() => ({ error: { title: 'Errore aggiornamento' } })));
      component.form.patchValue({ quantity: 10 });
      component.save();
      setTimeout(() => {
        expect(component.errorMsg()).toBe('Errore aggiornamento');
        expect(dialogRefSpy.close).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Form submission', () => {
    let fixture: ComponentFixture<BillOfMaterialDialogComponent>;
    let compiled: HTMLElement;
    let component: BillOfMaterialDialogComponent;

    beforeEach(() => {
      fixture = createFixture({ parentArticleId: 1 });
      compiled = fixture.nativeElement;
      component = fixture.componentInstance;
      bomServiceSpy.create.and.returnValue(of(mockBOM));
    });

    it('il bottone Salva è disabilitato se form invalido', () => {
      fixture.detectChanges();
      const button = compiled.querySelector('[mat-raised-button][color="primary"]') as HTMLButtonElement;
      expect(button.disabled).toBeTrue();
    });

    it('il bottone Salva è abilitato se form valido', () => {
      component.form.patchValue({
        componentArticleId: 2,
        quantity: 5,
        quantityType: 'PHYSICAL',
        umId: 1
      });
      fixture.detectChanges();
      const button = compiled.querySelector('[mat-raised-button][color="primary"]') as HTMLButtonElement;
      expect(button.disabled).toBeFalse();
    });

    it('il bottone Annulla chiude il dialog senza risultato', () => {
      fixture.detectChanges();
      const button = compiled.querySelector('[mat-button]') as HTMLButtonElement;
      button.click();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });
  });

  describe('Scrap fields', () => {
    let fixture: ComponentFixture<BillOfMaterialDialogComponent>;
    let component: BillOfMaterialDialogComponent;

    beforeEach(() => {
      fixture = createFixture({ parentArticleId: 1 });
      component = fixture.componentInstance;
    });

    it('permette di impostare tutti e tre i tipi di scarto contemporaneamente', () => {
      component.form.patchValue({
        scrapPercentage: 5,
        scrapFactor: 1.1,
        fixedScrap: 2
      });
      expect(component.form.get('scrapPercentage')?.value).toBe(5);
      expect(component.form.get('scrapFactor')?.value).toBe(1.1);
      expect(component.form.get('fixedScrap')?.value).toBe(2);
    });

    it('inizializza i campi scrap a 0 in creazione', () => {
      expect(component.form.get('scrapPercentage')?.value).toBe(0);
      expect(component.form.get('scrapFactor')?.value).toBe(0);
      expect(component.form.get('fixedScrap')?.value).toBe(0);
    });
  });

  describe('Loading state', () => {
    let fixture: ComponentFixture<BillOfMaterialDialogComponent>;
    let compiled: HTMLElement;
    let component: BillOfMaterialDialogComponent;

    beforeEach(() => {
      fixture = createFixture({ parentArticleId: 1 });
      component = fixture.componentInstance;
      compiled = fixture.nativeElement;
    });

    it('mostra lo spinner durante il caricamento', () => {
      component.loading.set(true);
      fixture.detectChanges();
      const spinner = compiled.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('nasconde il form durante il caricamento', () => {
      component.loading.set(true);
      fixture.detectChanges();
      const content = compiled.querySelector('mat-dialog-content');
      expect(content).toBeFalsy();
    });
  });
});
