import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { CategoryDialogComponent } from './category-dialog.component';
import { CategoriesService } from '../../../core/services/categories.service';
import { CategoryResponse } from '../../../core/models/article.models';

describe('CategoryDialogComponent', () => {
  let categoriesServiceSpy: jasmine.SpyObj<CategoriesService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CategoryDialogComponent>>;

  const mockCategory: CategoryResponse = {
    id: 1,
    name: 'Categoria Test',
    description: 'Descrizione categoria'
  };

  function createFixture(dialogData: any): ComponentFixture<CategoryDialogComponent> {
    TestBed.configureTestingModule({
      imports: [CategoryDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: CategoriesService, useValue: categoriesServiceSpy }
      ]
    }).compileComponents();

    const f = TestBed.createComponent(CategoryDialogComponent);
    f.detectChanges();
    return f;
  }

  beforeEach(() => {
    categoriesServiceSpy = jasmine.createSpyObj('CategoriesService', ['create', 'update']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('modalità creazione', () => {
    let fixture: ComponentFixture<CategoryDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({});
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Nuova Categoria"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Nuova Categoria');
    });

    it('mostra i campi Nome e Descrizione', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).toContain('Nome');
      expect(labels).toContain('Descrizione (opzionale)');
    });

    it('form invalido con campo Nome vuoto', () => {
      const component = fixture.componentInstance;
      component.submit();
      expect(component.form.invalid).toBeTrue();
      expect(categoriesServiceSpy.create).not.toHaveBeenCalled();
    });

    it('chiama create() con form valido', () => {
      categoriesServiceSpy.create.and.returnValue(of({ ...mockCategory, id: 10 }));
      const component = fixture.componentInstance;
      component.form.setValue({
        name: 'Nuova Categoria',
        description: 'Descrizione'
      });
      component.submit();
      expect(categoriesServiceSpy.create).toHaveBeenCalledWith({
        name: 'Nuova Categoria',
        description: 'Descrizione'
      });
    });

    it('chiama create() con description undefined se vuota', () => {
      categoriesServiceSpy.create.and.returnValue(of({ ...mockCategory, id: 10 }));
      const component = fixture.componentInstance;
      component.form.setValue({
        name: 'Nuova Categoria',
        description: ''
      });
      component.submit();
      expect(categoriesServiceSpy.create).toHaveBeenCalledWith({
        name: 'Nuova Categoria',
        description: undefined
      });
    });
  });

  describe('modalità modifica', () => {
    let fixture: ComponentFixture<CategoryDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({ category: mockCategory });
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Modifica Categoria"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Modifica Categoria');
    });

    it('pre-popola il nome dal dato categoria', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('name')?.value).toBe('Categoria Test');
    });

    it('pre-popola la descrizione dal dato categoria', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('description')?.value).toBe('Descrizione categoria');
    });

    it('chiama update() al submit', () => {
      categoriesServiceSpy.update.and.returnValue(of(mockCategory));
      const component = fixture.componentInstance;
      component.form.patchValue({
        name: 'Categoria Aggiornata'
      });
      component.submit();
      expect(categoriesServiceSpy.update).toHaveBeenCalledWith(1, jasmine.objectContaining({
        name: 'Categoria Aggiornata'
      }));
    });
  });

  describe('gestione errori', () => {
    let fixture: ComponentFixture<CategoryDialogComponent>;

    beforeEach(() => {
      fixture = createFixture({});
    });

    it('mostra messaggio di errore se create() fallisce', () => {
      const errorResponse = { error: { title: 'Errore nella creazione' } };
      categoriesServiceSpy.create.and.returnValue(throwError(() => errorResponse));
      const component = fixture.componentInstance;
      component.form.setValue({
        name: 'Test',
        description: ''
      });
      component.submit();
      fixture.detectChanges();
      expect(component.errorMessage()).toBe('Errore nella creazione');
    });

    it('mostra messaggio generico se l\'errore non ha title', () => {
      const errorResponse = { error: {} };
      categoriesServiceSpy.create.and.returnValue(throwError(() => errorResponse));
      const component = fixture.componentInstance;
      component.form.setValue({
        name: 'Test',
        description: ''
      });
      component.submit();
      fixture.detectChanges();
      expect(component.errorMessage()).toBe('Errore nella creazione');
    });
  });
});
