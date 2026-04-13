import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { CategoriesComponent } from './categories.component';
import { CategoriesService } from '../../../core/services/categories.service';
import { MatDialog } from '@angular/material/dialog';
import { CategoryResponse } from '../../../core/models/article.models';

describe('CategoriesComponent', () => {
  let fixture: ComponentFixture<CategoriesComponent>;
  let component: CategoriesComponent;
  let compiled: HTMLElement;
  let categoriesServiceSpy: jasmine.SpyObj<CategoriesService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockCategories: CategoryResponse[] = [
    { id: 1, name: 'Abbigliamento', description: 'Vestiti e accessori' },
    { id: 2, name: 'Calzature', description: null }
  ];

  beforeEach(async () => {
    categoriesServiceSpy = jasmine.createSpyObj('CategoriesService', ['getAll', 'delete']);
    categoriesServiceSpy.getAll.and.returnValue(of(mockCategories));
    categoriesServiceSpy.delete.and.returnValue(of(void 0));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    await TestBed.configureTestingModule({
      imports: [CategoriesComponent, NoopAnimationsModule],
      providers: [
        { provide: CategoriesService, useValue: categoriesServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoriesComponent);
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
    expect(compiled.textContent).toContain('Abbigliamento');
    expect(compiled.textContent).toContain('Calzature');
  });

  it('chiama getAll() all\'inizializzazione', () => {
    expect(categoriesServiceSpy.getAll).toHaveBeenCalledTimes(1);
  });

  it('delete() chiama categoriesService.delete dopo conferma', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.delete(mockCategories[0]);
    expect(categoriesServiceSpy.delete).toHaveBeenCalledWith(1);
  });

  it('delete() non chiama il servizio se l\'utente annulla', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.delete(mockCategories[0]);
    expect(categoriesServiceSpy.delete).not.toHaveBeenCalled();
  });

  it('openCreateDialog() apre il dialog', () => {
    component.openCreateDialog();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('openEditDialog() apre il dialog con i dati della categoria', () => {
    component.openEditDialog(mockCategories[0]);
    expect(dialogSpy.open).toHaveBeenCalledWith(
      jasmine.any(Function),
      jasmine.objectContaining({ data: { category: mockCategories[0] } })
    );
  });
});
