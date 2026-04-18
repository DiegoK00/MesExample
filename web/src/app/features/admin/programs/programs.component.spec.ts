import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ProgramsComponent } from './programs.component';
import { ProgramsService } from '../../../core/services/programs.service';
import { MatDialog } from '@angular/material/dialog';
import { ProgramResponse } from '../../../core/models/program.models';

describe('ProgramsComponent', () => {
  let fixture: ComponentFixture<ProgramsComponent>;
  let component: ProgramsComponent;
  let compiled: HTMLElement;
  let programsServiceSpy: jasmine.SpyObj<ProgramsService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockPrograms: ProgramResponse[] = [
    { id: 1, code: 'PROG_A', name: 'Programma A', description: 'Desc A', isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 2, code: 'PROG_B', name: 'Programma B', description: null, isActive: false, createdAt: '2026-01-02T00:00:00Z' }
  ];

  beforeEach(async () => {
    programsServiceSpy = jasmine.createSpyObj('ProgramsService', ['getAll', 'delete']);
    programsServiceSpy.getAll.and.returnValue(of(mockPrograms));
    programsServiceSpy.delete.and.returnValue(of(void 0));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    await TestBed.configureTestingModule({
      imports: [ProgramsComponent, NoopAnimationsModule],
      providers: [
        { provide: ProgramsService, useValue: programsServiceSpy }
      ]
    }).overrideProvider(MatDialog, { useValue: dialogSpy }).compileComponents();

    fixture = TestBed.createComponent(ProgramsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('mostra le colonne Codice, Nome, Stato nella tabella', () => {
    const headers = Array.from(compiled.querySelectorAll('th')).map(th => th.textContent?.trim());
    expect(headers).toContain('Codice');
    expect(headers).toContain('Nome');
    expect(headers).toContain('Stato');
  });

  it('mostra i dati mock nella tabella', () => {
    const rows = compiled.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
    expect(compiled.textContent).toContain('PROG_A');
    expect(compiled.textContent).toContain('Programma B');
  });

  it('chiama getAll() all\'inizializzazione', () => {
    expect(programsServiceSpy.getAll).toHaveBeenCalledTimes(1);
  });

  it('attivare il toggle "Solo attivi" chiama getAll con activeOnly', () => {
    component.activeOnly = true;
    component.load();
    expect(programsServiceSpy.getAll).toHaveBeenCalledWith(true);
  });

  it('delete() chiama programsService.delete dopo conferma', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.delete(mockPrograms[0]);
    expect(programsServiceSpy.delete).toHaveBeenCalledWith(1);
  });

  it('delete() non chiama il servizio se l\'utente annulla', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.delete(mockPrograms[0]);
    expect(programsServiceSpy.delete).not.toHaveBeenCalled();
  });

  it('openCreateDialog() apre il dialog', () => {
    component.openCreateDialog();
    expect(dialogSpy.open).toHaveBeenCalled();
  });
});
