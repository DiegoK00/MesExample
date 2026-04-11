import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ProgramDialogComponent } from './program-dialog.component';
import { ProgramsService } from '../../../core/services/programs.service';

describe('ProgramDialogComponent', () => {
  let programsServiceSpy: jasmine.SpyObj<ProgramsService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ProgramDialogComponent>>;

  const mockProgram: any = {
    id: 3,
    code: 'PROG_TEST',
    name: 'Programma Test',
    description: 'Una descrizione',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z'
  };

  function createFixture(dialogData: any): ComponentFixture<ProgramDialogComponent> {
    TestBed.configureTestingModule({
      imports: [ProgramDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ProgramsService, useValue: programsServiceSpy }
      ]
    }).compileComponents();

    const f = TestBed.createComponent(ProgramDialogComponent);
    f.detectChanges();
    return f;
  }

  beforeEach(() => {
    programsServiceSpy = jasmine.createSpyObj('ProgramsService', ['create', 'update']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
  });

  afterEach(() => TestBed.resetTestingModule());

  describe('modalità creazione', () => {
    let fixture: ComponentFixture<ProgramDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({});
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Nuovo Programma"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Nuovo Programma');
    });

    it('mostra il campo Codice in modalità creazione', () => {
      const labels = Array.from(compiled.querySelectorAll('mat-label')).map(l => l.textContent?.trim());
      expect(labels).toContain('Codice');
    });

    it('uppercaseCode() converte l\'input in maiuscolo', () => {
      const component = fixture.componentInstance;
      const fakeInput = document.createElement('input');
      fakeInput.value = 'test_code';
      component.uppercaseCode({ target: fakeInput } as unknown as Event);
      expect(component.form.get('code')?.value).toBe('TEST_CODE');
    });

    it('form invalido con campi vuoti al submit', () => {
      const component = fixture.componentInstance;
      component.submit();
      expect(component.form.invalid).toBeTrue();
      expect(programsServiceSpy.create).not.toHaveBeenCalled();
    });

    it('chiama create() con form valido', () => {
      programsServiceSpy.create.and.returnValue(of(mockProgram));
      const component = fixture.componentInstance;
      component.form.setValue({ code: 'NUOVO_PROG', name: 'Nuovo', description: '' });
      component.submit();
      expect(programsServiceSpy.create).toHaveBeenCalledWith(jasmine.objectContaining({
        code: 'NUOVO_PROG',
        name: 'Nuovo'
      }));
    });
  });

  describe('modalità modifica', () => {
    let fixture: ComponentFixture<ProgramDialogComponent>;
    let compiled: HTMLElement;

    beforeEach(() => {
      fixture = createFixture({ program: mockProgram });
      compiled = fixture.nativeElement;
    });

    it('mostra il titolo "Modifica Programma"', () => {
      expect(compiled.querySelector('[mat-dialog-title]')?.textContent).toContain('Modifica Programma');
    });

    it('mostra il codice come testo readonly (non input)', () => {
      expect(compiled.querySelector('.code-readonly')).toBeTruthy();
      expect(compiled.querySelector('.code-readonly')?.textContent).toContain('PROG_TEST');
    });

    it('pre-popola il nome dal programma', () => {
      const component = fixture.componentInstance;
      expect(component.form.get('name')?.value).toBe('Programma Test');
    });

    it('chiama update() al submit', () => {
      programsServiceSpy.update.and.returnValue(of(mockProgram));
      const component = fixture.componentInstance;
      component.submit();
      expect(programsServiceSpy.update).toHaveBeenCalledWith(3, jasmine.objectContaining({
        name: 'Programma Test'
      }));
    });
  });
});
