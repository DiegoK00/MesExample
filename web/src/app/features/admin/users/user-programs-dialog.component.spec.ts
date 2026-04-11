import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { UserProgramsDialogComponent } from './user-programs-dialog.component';
import { UsersService } from '../../../core/services/users.service';
import { ProgramsService } from '../../../core/services/programs.service';
import { UserProgramResponse, ProgramResponse } from '../../../core/models/program.models';

const mockAssigned: UserProgramResponse[] = [
  { programId: 1, code: 'PROG1', name: 'Programma 1', grantedAt: '2024-01-01', grantedByUsername: 'admin' }
];

const mockAllPrograms: ProgramResponse[] = [
  { id: 1, code: 'PROG1', name: 'Programma 1', description: null, isActive: true, createdAt: '2024-01-01' },
  { id: 2, code: 'PROG2', name: 'Programma 2', description: null, isActive: true, createdAt: '2024-01-01' },
  { id: 3, code: 'PROG3', name: 'Programma 3', description: null, isActive: false, createdAt: '2024-01-01' },
];

describe('UserProgramsDialogComponent', () => {
  let fixture: ComponentFixture<UserProgramsDialogComponent>;
  let component: UserProgramsDialogComponent;
  let usersSpy: jasmine.SpyObj<UsersService>;
  let programsSpy: jasmine.SpyObj<ProgramsService>;

  beforeEach(async () => {
    usersSpy = jasmine.createSpyObj('UsersService', ['getUserPrograms', 'assignPrograms', 'revokePrograms']);
    programsSpy = jasmine.createSpyObj('ProgramsService', ['getAll']);

    usersSpy.getUserPrograms.and.returnValue(of(mockAssigned));
    programsSpy.getAll.and.returnValue(of(mockAllPrograms));

    await TestBed.configureTestingModule({
      imports: [UserProgramsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: UsersService, useValue: usersSpy },
        { provide: ProgramsService, useValue: programsSpy },
        { provide: MAT_DIALOG_DATA, useValue: { userId: 42, username: 'mario' } },
        { provide: MatDialogRef, useValue: {} },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProgramsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load assigned and all programs on init', () => {
    expect(usersSpy.getUserPrograms).toHaveBeenCalledWith(42);
    expect(programsSpy.getAll).toHaveBeenCalled();
    expect(component.assigned().length).toBe(1);
    expect(component.allPrograms().length).toBe(3);
  });

  it('available() excludes already-assigned and inactive programs', () => {
    // PROG1 is assigned, PROG3 is inactive → only PROG2 available
    expect(component.available().length).toBe(1);
    expect(component.available()[0].code).toBe('PROG2');
  });

  it('should show dialog title with username', () => {
    const compiled: HTMLElement = fixture.nativeElement;
    expect(compiled.querySelector('[mat-dialog-title]')!.textContent).toContain('mario');
  });

  it('assign() calls assignPrograms and updates assigned list', () => {
    const updatedAssigned: UserProgramResponse[] = [
      ...mockAssigned,
      { programId: 2, code: 'PROG2', name: 'Programma 2', grantedAt: '2024-01-02', grantedByUsername: 'admin' }
    ];
    usersSpy.assignPrograms.and.returnValue(of(updatedAssigned));
    component.assign(2);
    expect(usersSpy.assignPrograms).toHaveBeenCalledWith(42, [2]);
    expect(component.assigned().length).toBe(2);
  });

  it('revoke() calls revokePrograms and removes from assigned list', () => {
    usersSpy.revokePrograms.and.returnValue(of(undefined));
    component.revoke(1);
    expect(usersSpy.revokePrograms).toHaveBeenCalledWith(42, [1]);
    expect(component.assigned().length).toBe(0);
  });

  it('should handle load error gracefully', async () => {
    usersSpy.getUserPrograms.and.returnValue(throwError(() => new Error('500')));
    component['loadData']();
    fixture.detectChanges();
    expect(component.loading()).toBeFalse();
    expect(component.assigned().length).toBe(0);
  });
});
