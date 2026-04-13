import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ArticlesComponent } from './articles.component';
import { ArticlesService } from '../../../core/services/articles.service';
import { MatDialog } from '@angular/material/dialog';
import { ArticleResponse } from '../../../core/models/article.models';

describe('ArticlesComponent', () => {
  let fixture: ComponentFixture<ArticlesComponent>;
  let component: ArticlesComponent;
  let compiled: HTMLElement;
  let articlesServiceSpy: jasmine.SpyObj<ArticlesService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockArticles: ArticleResponse[] = [
    {
      id: 1,
      code: 'ART001',
      name: 'Articolo Test 1',
      description: 'Descrizione 1',
      categoryId: 1,
      categoryName: 'Categoria A',
      price: 29.99,
      umId: 1,
      umName: 'PZ',
      um2Id: null,
      um2Name: null,
      isActive: true,
      measures: 'S/M/L',
      composition: 'Cotton 100%',
      createdAt: '2026-04-01T10:00:00',
      createdByUsername: 'admin',
      deletedAt: null,
      deletedByUsername: null
    },
    {
      id: 2,
      code: 'ART002',
      name: 'Articolo Test 2',
      description: 'Descrizione 2',
      categoryId: 2,
      categoryName: 'Categoria B',
      price: 49.99,
      umId: 2,
      umName: 'KG',
      um2Id: null,
      um2Name: null,
      isActive: false,
      measures: null,
      composition: null,
      createdAt: '2026-04-02T11:00:00',
      createdByUsername: 'admin',
      deletedAt: null,
      deletedByUsername: null
    }
  ];

  beforeEach(async () => {
    articlesServiceSpy = jasmine.createSpyObj('ArticlesService', ['getAll', 'delete']);
    articlesServiceSpy.getAll.and.returnValue(of(mockArticles));
    articlesServiceSpy.delete.and.returnValue(of(void 0));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);

    await TestBed.configureTestingModule({
      imports: [ArticlesComponent, NoopAnimationsModule],
      providers: [
        { provide: ArticlesService, useValue: articlesServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    compiled = fixture.nativeElement;
  });

  it('mostra le colonne Codice, Nome, Categoria, Prezzo, UM, Stato, Azioni nella tabella', () => {
    const headers = Array.from(compiled.querySelectorAll('th')).map(th => th.textContent?.trim());
    expect(headers).toContain('Codice');
    expect(headers).toContain('Nome');
    expect(headers).toContain('Categoria');
    expect(headers).toContain('Prezzo');
    expect(headers).toContain('UM');
    expect(headers).toContain('Stato');
    expect(headers).toContain('Azioni');
  });

  it('mostra i dati mock nella tabella', () => {
    const rows = compiled.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
    expect(compiled.textContent).toContain('ART001');
    expect(compiled.textContent).toContain('Articolo Test 1');
  });

  it('chiama getAll() all\'inizializzazione', () => {
    expect(articlesServiceSpy.getAll).toHaveBeenCalledTimes(1);
  });

  it('load() carica gli articoli', () => {
    component.load();
    expect(articlesServiceSpy.getAll).toHaveBeenCalledTimes(2);
    expect(component.articles()).toEqual(mockArticles);
  });

  it('load() chiama getAll(true) quando activeOnly è true', () => {
    component.activeOnly = true;
    component.load();
    expect(articlesServiceSpy.getAll).toHaveBeenCalledWith(true);
  });

  it('delete() chiama articlesService.delete dopo conferma', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.delete(mockArticles[0]);
    expect(articlesServiceSpy.delete).toHaveBeenCalledWith(1);
  });

  it('delete() non chiama il servizio se l\'utente annulla', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.delete(mockArticles[0]);
    expect(articlesServiceSpy.delete).not.toHaveBeenCalled();
  });
});
