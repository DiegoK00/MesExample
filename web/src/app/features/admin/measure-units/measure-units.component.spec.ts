import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { MeasureUnitsComponent } from './measure-units.component';
import { MeasureUnitsService } from '../../../core/services/measure-units.service';
import { MatDialog } from '@angular/material/dialog';
import { MeasureUnitResponse } from '../../../core/models/article.models';

describe('MeasureUnitsComponent', () => {
  let fixture: ComponentFixture<MeasureUnitsComponent>;
  let component: MeasureUnitsComponent;
  let compiled: HTMLElement;
  let measureUnitsServiceSpy: jasmine.SpyObj<MeasureUnitsService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockUnits: MeasureUnitResponse[] = [
    { id: 1, name: 'PZ', description: 'Pezzi' },
    { id: 2, name: 'KG', description: 'Chilogrammi' }
  ];

  beforeEach(async () => {
    measureUnitsServiceSpy = jasmine.createSpyObj('MeasureUnitsService', ['getAll', 'delete']);
    measureUnitsServiceSpy.getAll.and.returnValue(of(mockUnits));
    measureUnitsServiceSpy.delete.and.returnValue(of(void 0));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    await TestBed.configureTestingModule({
      imports: [MeasureUnitsComponent, NoopAnimationsModule],
      providers: [
        { provide: MeasureUnitsService, useValue: measureUnitsServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MeasureUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('mostra le colonne Nome, Descrizione, Azioni nella tabella', () => {
    const headers = Array.from(compiled.querySelectorAll('th')).map(th => th.textContent?.trim());
    expect(headers).toContain('Nome');
    expect(headers).toContain('Descrizione');
    expect(headers).toContain('Azioni');
  });

  it('mostra i dati mock nella tabella', () => {
    const rows = compiled.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
    expect(compiled.textContent).toContain('PZ');
    expect(compiled.textContent).toContain('KG');
  });

  it('chiama getAll() all\'inizializzazione', () => {
    expect(measureUnitsServiceSpy.getAll).toHaveBeenCalledTimes(1);
  });

  it('delete() chiama measureUnitsService.delete dopo conferma', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.delete(mockUnits[0]);
    expect(measureUnitsServiceSpy.delete).toHaveBeenCalledWith(1);
  });

  it('delete() non chiama il servizio se l\'utente annulla', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.delete(mockUnits[0]);
    expect(measureUnitsServiceSpy.delete).not.toHaveBeenCalled();
  });

  it('openCreateDialog() apre il dialog', () => {
    component.openCreateDialog();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('openEditDialog() apre il dialog con i dati dell\'unità', () => {
    component.openEditDialog(mockUnits[0]);
    expect(dialogSpy.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({ data: { unit: mockUnits[0] } })
    );
  });
});
