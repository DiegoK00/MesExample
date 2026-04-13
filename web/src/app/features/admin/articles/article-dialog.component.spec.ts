import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { ArticleDialogComponent } from './article-dialog.component';
import { ArticlesService } from '../../../core/services/articles.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { ArticleResponse, CategoryResponse, MeasureUnitResponse } from '../../../core/models/article.models';

describe('ArticleDialogComponent', () => {
  let articlesServiceSpy: jasmine.SpyObj<ArticlesService>;
  let categoriesServiceSpy: jasmine.SpyObj<CategoriesService>;
  let measureUnitsServiceSpy: jasmine.SpyObj<MeasureUnitsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ArticleDialogComponent>>;

  const mockArticle: ArticleResponse = {
    id: 1,
    code: 'ART001',
    name: 'Articolo Test',
    description: 'Descrizione',
    categoryId: 1,
    categoryName: 'Categoria A',
    price: 29.99,
    umId: 1,
    umName: 'PZ',
    um2Id: 2,
    um2Name: 'KG',
    isActive: true,
    measures: 'S/M/L',
    composition: 'Cotton 100%',
    createdAt: '2026-04-01T10:00:00',
    createdByUsername: 'admin',
    deletedAt: null,
    deletedByUsername: null
  };

  const mockCategories: CategoryResponse[] = [
    { id: 1, name: 'Categoria A', description: 'Descrizione A' },
    { id: 2, name: 'Categoria B', description: 'Descrizione B' }
  ];

  const mockMeasureUnits: MeasureUnitResponse[] = [
    { id: 1, name: 'PZ', description: 'Pezzo' },
    { id: 2, name: 'KG', description: 'Chilogrammo' }
  ];

  function createFixture(dialogData: any): ComponentFixture<ArticleDialogComponent> {
    TestBed.configureTestingModule({
      imports: [ArticleDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ArticlesService, useValue: articlesServiceSpy },
        { provide: CategoriesService, useValue: categoriesServiceSpy },
        { provide: MeasureUnitsService, useValue: measureUnitsServiceSpy }
      ]
    }).compileComponents();

    const f = TestBed.createComponent(ArticleDialogComponent);
    f.detectChanges();
    return f;
  }

  beforeEach(() => {
    articlesServiceSpy = jasmine.createSpyObj('ArticlesService', ['create', 'update']);
    categoriesServiceSpy = jasmine.createSpyObj('CategoriesService', ['getAll']);
    measureUnitsServiceSpy = jasmine.createSpyObj('MeasureUnitsService', ['getAll']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    categoriesServiceSpy.getAll.and.returnValue(of(mockCategories));
    measureUnitsServiceSpy.getAll.and.returnValue(of(mockMeasureUnits));
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('modalità creazione', () => {
    let fixture: ComponentFixture<ArticleDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({});
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Nuovo Articolo"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Nuovo Articolo');
    });

    it('mostra il campo Codice', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).toContain('Codice');
    });

    it('mostra i campi Nome, Descrizione, Categoria, Prezzo, UM', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).toContain('Nome');
      expect(labels).toContain('Descrizione (opzionale)');
      expect(labels).toContain('Categoria');
      expect(labels).toContain('Prezzo (€)');
      expect(labels).toContain('UM');
    });

    it('form invalido con campi vuoti al submit', () => {
      const component = fixture.componentInstance;
      component.submit();
      expect(component.form.invalid).toBeTrue();
      expect(articlesServiceSpy.create).not.toHaveBeenCalled();
    });

    it('chiama create() con form valido', () => {
      articlesServiceSpy.create.and.returnValue(of({ ...mockArticle, id: 10 }));
      const component = fixture.componentInstance;
      component.form.setValue({
        code: 'ART999',
        name: 'Nuovo Articolo',
        description: 'Descrizione',
        categoryId: 1,
        price: 19.99,
        umId: 1,
        um2Id: undefined,
        measures: 'S/M/L',
        composition: 'Cotton 100%'
      });
      component.submit();
      expect(articlesServiceSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
        code: 'ART999',
        name: 'Nuovo Articolo',
        categoryId: 1,
        price: 19.99,
        umId: 1,
        measures: 'S/M/L',
        composition: 'Cotton 100%'
      }));
    });
  });

  describe('modalità modifica', () => {
    let fixture: ComponentFixture<ArticleDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({ article: mockArticle });
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Modifica Articolo"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Modifica Articolo');
    });

    it('non mostra il campo Codice', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).not.toContain('Codice');
    });

    it('mostra il codice readonly', () => {
      expect(compiled.textContent).toContain('ART001');
    });

    it('pre-popola il nome dal dato articolo', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('name')?.value).toBe('Articolo Test');
    });

    it('pre-popola il prezzo dal dato articolo', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('price')?.value).toBe(29.99);
    });

    it('chiama update() al submit', () => {
      articlesServiceSpy.update.and.returnValue(of(mockArticle));
      const component = fixture.componentInstance;
      component.submit();
      expect(articlesServiceSpy.update).toHaveBeenCalledWith(1, jasmine.objectContaining({
        name: 'Articolo Test',
        price: 29.99
      }));
    });

    it('mostra il checkbox isActive in modalità modifica', () => {
      const checkboxes = Array.from(compiled.querySelectorAll('mat-checkbox')).map(c => c.textContent?.trim());
      expect(checkboxes).toContain('Articolo attivo');
    });
  });

  describe('gestione errori', () => {
    let fixture: ComponentFixture<ArticleDialogComponent>;

    beforeEach(() => {
      fixture = createFixture({});
    });

    it('mostra messaggio di errore se create() fallisce', () => {
      const errorResponse = { error: { title: 'Errore di creazione' } };
      articlesServiceSpy.create.and.returnValue(throwError(() => errorResponse));
      const component = fixture.componentInstance;
      component.form.setValue({
        code: 'ART999',
        name: 'Test',
        description: '',
        categoryId: 1,
        price: 10,
        umId: 1,
        um2Id: null,
        measures: '',
        composition: ''
      });
      component.submit();
      fixture.detectChanges();
      expect(component.errorMessage()).toBe('Errore di creazione');
    });
  });
});
