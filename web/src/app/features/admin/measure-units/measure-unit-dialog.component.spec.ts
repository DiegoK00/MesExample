import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { MeasureUnitDialogComponent } from './measure-unit-dialog.component';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { MeasureUnitResponse } from '../../../core/models/article.models';

describe('MeasureUnitDialogComponent', () => {
  let measureUnitsServiceSpy: jasmine.SpyObj<MeasureUnitsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MeasureUnitDialogComponent>>;

  const mockUnit: MeasureUnitResponse = {
    id: 1,
    name: 'Pezzo',
    description: 'Unità singola'
  };

  function createFixture(dialogData: any): ComponentFixture<MeasureUnitDialogComponent> {
    TestBed.configureTestingModule({
      imports: [MeasureUnitDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MeasureUnitsService, useValue: measureUnitsServiceSpy }
      ]
    }).compileComponents();

    const f = TestBed.createComponent(MeasureUnitDialogComponent);
    f.detectChanges();
    return f;
  }

  beforeEach(() => {
    measureUnitsServiceSpy = jasmine.createSpyObj('MeasureUnitsService', ['create', 'update']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('modalità creazione', () => {
    let fixture: ComponentFixture<MeasureUnitDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({});
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Nuova Unità di Misura"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Nuova Unità di Misura');
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
      expect(measureUnitsServiceSpy.create).not.toHaveBeenCalled();
    });

    it('chiama create() con form valido', () => {
      measureUnitsServiceSpy.create.and.returnValue(of({ ...mockUnit, id: 10 }));
      const component = fixture.componentInstance;
      component.form.setValue({
        name: 'Chilogrammo',
        description: 'Peso'
      });
      component.submit();
      expect(measureUnitsServiceSpy.create).toHaveBeenCalledWith({
        name: 'Chilogrammo',
        description: 'Peso'
      });
    });

    it('chiama create() con description undefined se vuota', () => {
      measureUnitsServiceSpy.create.and.returnValue(of({ ...mockUnit, id: 10 }));
      const component = fixture.componentInstance;
      component.form.setValue({
        name: 'Metro',
        description: ''
      });
      component.submit();
      expect(measureUnitsServiceSpy.create).toHaveBeenCalledWith({
        name: 'Metro',
        description: undefined
      });
    });
  });

  describe('modalità modifica', () => {
    let fixture: ComponentFixture<MeasureUnitDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({ unit: mockUnit });
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Modifica Unità di Misura"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Modifica Unità di Misura');
    });

    it('pre-popola il nome dal dato unità', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('name')?.value).toBe('Pezzo');
    });

    it('pre-popola la descrizione dal dato unità', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('description')?.value).toBe('Unità singola');
    });

    it('chiama update() al submit', () => {
      measureUnitsServiceSpy.update.and.returnValue(of(mockUnit));
      const component = fixture.componentInstance;
      component.form.patchValue({
        name: 'PZ'
      });
      component.submit();
      expect(measureUnitsServiceSpy.update).toHaveBeenCalledWith(1, jasmine.objectContaining({
        name: 'PZ'
      }));
    });
  });

  describe('gestione errori', () => {
    let fixture: ComponentFixture<MeasureUnitDialogComponent>;

    beforeEach(() => {
      fixture = createFixture({});
    });

    it('mostra messaggio di errore se create() fallisce', () => {
      const errorResponse = { error: { title: 'Nome già esistente' } };
      measureUnitsServiceSpy.create.and.returnValue(throwError(() => errorResponse));
      const component = fixture.componentInstance;
      component.form.setValue({
        name: 'PZ',
        description: ''
      });
      component.submit();
      fixture.detectChanges();
      expect(component.errorMessage()).toBe('Nome già esistente');
    });

    it('mostra messaggio generico se l\'errore non ha title in create', () => {
      const errorResponse = { error: {} };
      measureUnitsServiceSpy.create.and.returnValue(throwError(() => errorResponse));
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
