import {
  AfterViewInit,
  Component,
  Injector,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort } from '@angular/material/sort';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { last } from 'lodash-es';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/shared/services/auth.service';

import { ConfirmComponent } from '../../modals/confirm/confirm.component';
import {
  UseCaseDto,
  UseCaseFilter,
  UseCaseFormStep,
  UseCaseStatus,
  UserRole,
  USE_CASE_FORM_STEPS,
  USE_CASE_STATUS_COLORS,
  USE_CASE_STATUS_LABELS,
  USE_CASE_STEPS_ROLES_MAP,
} from '../../shared';
import { State, UseCase } from '../../store';
import { getThumbnailSrc } from '../../util';
import { TableDirective } from '../../util/table';
import { UseCaseTableDataSource } from '../../util/table-data-source';
import { TablePaginatorComponent } from '../table-paginator/table-paginator.component';

const TABLE_ID = 'use-cases';

@Component({
  selector: 'app-use-cases-table',
  templateUrl: './use-cases-table.component.html',
  styleUrls: ['./use-cases-table.component.scss'],
})
export class UseCasesTableComponent
  extends TableDirective<UseCaseDto>
  implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private filter$ = new BehaviorSubject<UseCaseFilter>({});

  @Input()
  set filter(filter: { plantId?: string; q?: string }) {
    this.filter$.next(filter || {});
  }

  @ViewChild(MatSort)
  sort!: MatSort;

  @ViewChild(TablePaginatorComponent)
  tablePaginator!: TablePaginatorComponent;

  dataSource = new UseCaseTableDataSource(this.store, TABLE_ID);

  constructor(
    protected injector: Injector,
    private store: Store<State>,
    private dialog: MatDialog,
    private translate: TranslateService,
    public authService: AuthService,
  ) {
    super(injector, [
      { name: 'image', breakpoints: [''] },
      { name: 'name', breakpoints: [''] },
      { name: 'createdBy', breakpoints: [''] },
      { name: 'updatedAt', breakpoints: [''] },
      { name: 'status', breakpoints: [''] },
      // { name: 'building', breakpoints: [''] },
      // { name: 'line', breakpoints: [''] },
      // { name: 'position', breakpoints: [''] },
      { name: 'responsible', breakpoints: [''] },
      { name: 'actions', breakpoints: [''] },
    ]);
  }

  ngOnInit() {
    this.store
      .select(UseCase.selectTableItems('use-cases'))
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        return (this.data = data);
      });

    this.filter$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filter => this.dataSource.loadUseCases(filter));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    this.paginator = this.tablePaginator.paginator;
    super.ngAfterViewInit();
  }

  openConfirmModal(useCase: UseCaseDto): void {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      data: {
        title: this.translate.instant('MODALS.DELETE_USE_CASE.TITLE'),
        text: this.translate.instant('MODALS.DELETE_USE_CASE.BODY', useCase),
        confirmText: this.translate.instant('MODALS.DELETE_USE_CASE.CONFIRM'),
        abortText: this.translate.instant('MODALS.DELETE_USE_CASE.ABORT'),
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.dispatch(UseCase.deleteUseCase({ id: useCase.id, tableId: TABLE_ID }));
      }
    });
  }

  setUseCaseLive(useCase: UseCaseDto): void {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      data: {
        title: this.translate.instant('MODALS.USE_CASE_LIVE.TITLE'),
        text: this.translate.instant('MODALS.USE_CASE_LIVE.BODY', useCase),
        confirmText: this.translate.instant('MODALS.USE_CASE_LIVE.CONFIRM'),
        abortText: this.translate.instant('MODALS.USE_CASE_LIVE.ABORT'),
      },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.dispatch(
          UseCase.changeUseCaseStatus({
            id: useCase.id,
            status: 'live',
            tableId: TABLE_ID,
          }),
        );
      }
    });
  }

  getUseCaseProgress(useCase: UseCaseDto) {
    const numCompleted = useCase.steps.reduce(
      (prev, curr) => prev + (USE_CASE_FORM_STEPS.includes(curr.type) ? 1 : 0),
      0,
    );
    return (numCompleted / USE_CASE_FORM_STEPS.length) * 100;
  }

  getThumbnailSrc = getThumbnailSrc;

  getStatusLabel(status: UseCaseStatus) {
    return USE_CASE_STATUS_LABELS[status];
  }

  getStatusClass(element: UseCaseDto) {
    return USE_CASE_STATUS_COLORS[element.status];
  }

  isDeclined(element: UseCaseDto) {
    return element.status === 'declined';
  }

  canSetLive(element: UseCaseDto) {
    return element.status === 'in-implementation' && this.authService.isAIQXTeam;
  }

  getNextStepResponsibility(element: UseCaseDto) {
    const completedSteps = element.steps.filter(s => !!s.completedAt);
    if (element.status === 'declined' || completedSteps.length === USE_CASE_FORM_STEPS.length) {
      return '';
    }
    const nextStep = USE_CASE_FORM_STEPS[completedSteps.length];
    if (nextStep) {
      const entry = Object.entries(USE_CASE_STEPS_ROLES_MAP).find(([role, steps]) =>
        steps.includes(nextStep),
      ) as [UserRole, UseCaseFormStep[]];
      if (entry && entry[0] === 'AIQX_TEAM') {
        return 'USER.AIQX_TEAM';
      }
    }
    return 'USER.REQUESTOR';
  }

  getCurrentStep(element: UseCaseDto) {
    return last(element.steps)?.type || 'initial-request';
  }

  canEdit(element: UseCaseDto) {
    if (this.authService.isAIQXTeam) {
      return true;
    }
    if (element.status === 'declined') {
      return false;
    }
    const step = USE_CASE_FORM_STEPS[element.steps.length];
    return !element || USE_CASE_STEPS_ROLES_MAP[this.authService.role].includes(step);
  }

  canDelete(element: UseCaseDto) {
    if (this.authService.isAIQXTeam) {
      return true;
    }
    return (
      this.authService.me?.id === element.createdBy && !element.steps.some(s => !!s.completedAt)
    );
  }
}
