import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Action, ActionCreator, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import {
  filter,
  map,
  mapTo,
  pairwise,
  shareReplay,
  skip,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators';
import { BreadCrumbSegment } from 'src/app/components/breadcrumb/breadcrumb.component';
import { ConfirmComponent } from 'src/app/modals/confirm/confirm.component';
import {
  StepConfirm,
  UseCasesStepConfirmComponent,
} from 'src/app/modals/use-cases-step-confirm/use-cases-step-confirm.component';
import {
  AttachmentCandidate,
  AttachmentDto,
  FormStep,
  ImageAttachmentDto,
  isCandidate,
  STEPS,
  SUB_STEPS_MAP,
  UseCaseConfiguratorService,
  UseCaseDto,
  UseCaseFormStep,
  UseCaseStatus,
} from 'src/app/shared';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Attachment, Plant, State, UseCase } from 'src/app/store';

@Component({
  selector: 'app-use-case-form-outlet',
  templateUrl: './use-case-form-outlet.component.html',
  styleUrls: ['./use-case-form-outlet.component.scss'],
})
export class UseCaseFormOutletComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private url$ = this.router.events.pipe(
    filter(ev => ev instanceof NavigationEnd),
    map(ev => (ev as NavigationEnd).urlAfterRedirects),
    startWith(this.router.url),
  );
  private useCaseId = this.route.snapshot.params['useCaseId'] as string | undefined;
  private snapshotData = this.route.snapshot.data as { useCase: UseCaseDto | undefined };
  private passGuard = false;

  useCase$ = this.route.data.pipe(
    startWith(this.route.snapshot.data),
    map(data => (data.useCase || {}) as Partial<UseCaseDto>),
  );
  plantId$ = this.route.queryParams.pipe(
    map(queryParams => queryParams['plantId'] as string | undefined),
    filter(id => !!id),
    startWith(this.snapshotData.useCase?.plantId),
  );
  segments$ = combineLatest([this.useCase$, this.plantId$.pipe(startWith(undefined))]).pipe(
    map(([useCase, plantId]) => this.getSegments(useCase, plantId)),
  );
  tabIndex$ = this.route.queryParams.pipe(
    map(params => {
      const index = Number(params['tab-index']);
      return Number.isInteger(index) && index >= 0 ? index : 0;
    }),
  );
  steps$: Observable<FormStep[]> = this.useCase$.pipe(
    map(useCase => this.getSteps(this.useCaseId, useCase)),
  );
  stepperIndex$ = this.url$.pipe(
    switchMap(url => this.steps$.pipe(map(steps => this.findStepByUrl(steps, url)))),
    startWith(0),
  );
  mainStepIndex$ = this.url$.pipe(
    map(url => this.findStepByUrl(STEPS, url)),
    startWith(0),
  );
  subSteps$ = this.mainStepIndex$.pipe(
    map(index => STEPS[index].subSteps),
    startWith([]),
  );
  currentForm$ = this.mainStepIndex$.pipe(map(index => STEPS[index].form));
  saveDisabled$ = combineLatest([this.configurator.canSubmit$, this.currentForm$]).pipe(
    map(([value, step]) => !value || !this.configurator.canEditStep(step)),
  );
  submitDisabled$ = combineLatest([this.configurator.disabledSteps$, this.currentForm$]).pipe(
    map(([steps, step]) => steps.includes(step) || !this.configurator.canEditStep(step)),
    shareReplay(),
  );
  offerDisabled$ = combineLatest([this.submitDisabled$, this.configurator.offerAcceptable$]).pipe(
    map(([disabled, acceptable]) => disabled || !acceptable),
  );

  loading = false;

  constructor(
    private route: ActivatedRoute,
    private store: Store<State>,
    private actions$: Actions,
    public router: Router,
    public configurator: UseCaseConfiguratorService,
    public authService: AuthService,
    private translate: TranslateService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(Plant.loadPlants());
    let didInit = false;

    // Prevent creating use case without a plant.
    if (!this.useCaseId && !this.route.snapshot.queryParams['plantId']) {
      this.passGuard = true;
      this.router.navigate(['/plants']);
      return;
    }

    if (this.useCaseId) {
      this.store.dispatch(Attachment.loadUseCaseAttachments({ useCaseId: this.useCaseId }));
      if (this.snapshotData.useCase && !didInit) {
        this.configurator.init(this.snapshotData.useCase);
        didInit = true;
      }
    }

    this.plantId$
      .pipe(
        takeUntil(this.destroy$),
        filter(plantId => !this.useCaseId && !!plantId && !didInit),
      )
      .subscribe(plantId => {
        this.configurator.init({ plantId });
        didInit = true;
      });

    combineLatest([this.currentForm$.pipe(pairwise()), this.tabIndex$.pipe(pairwise())])
      .pipe(
        takeUntil(this.destroy$),
        filter(
          ([[prevForm, currForm], [prevIdx, currIdx]]) =>
            prevForm === currForm && currIdx > prevIdx,
        ),
        map(([[form], [index]]) => SUB_STEPS_MAP[form][index]),
      )
      .subscribe(prev => this.configurator.markStepAsTouched(prev));

    this.configurator.showMandatoryOnly$.next(false);

    // Catch failed actions and set loading indicator to false.
    this.actions$
      .pipe(
        takeUntil(this.destroy$),
        ofType(
          UseCase.failedAddingUseCase,
          UseCase.failedCompletingUseCaseStep,
          UseCase.failedDeletingUseCase,
          UseCase.failedUpdatingUseCase,
        ),
      )
      .subscribe(() => (this.loading = false));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.configurator.close();
  }

  @HostListener('window:beforeunload')
  canDeactivate(): boolean {
    return this.passGuard || !this.configurator.hasFormChanged();
  }

  saveProgress(step: UseCaseFormStep) {
    this.loading = true;
    this.submit()
      .pipe(take(1))
      .subscribe(useCase => {
        this.loading = false;
        if (!this.useCaseId) {
          this.passGuard = true;
          this.router.navigate(['/use-cases', 'edit', useCase.id, step], {
            queryParamsHandling: 'merge',
            replaceUrl: true,
            queryParams: { plantId: null },
          });
        }
      });
  }

  submitUseCase(step: UseCaseFormStep) {
    this.loading = true;
    this.submit(step)
      .pipe(take(1))
      .subscribe(useCase => {
        this.loading = false;

        const dialogRef = this.getConfirmModal(step);
        dialogRef.afterClosed().subscribe(confirmed => {
          if (confirmed) {
            this.passGuard = true;
            this.router.navigate(['/use-cases', useCase.id]);
          }
        });
      });
  }

  deleteUseCase(id: string) {
    this.store
      .select(UseCase.selectUseCaseById(id))
      .pipe(
        take(1),
        filter(useCase => !!useCase),
        switchMap(useCase => {
          const dialogRef = this.dialog.open(ConfirmComponent, {
            data: {
              title: this.translate.instant('MODALS.DELETE_USE_CASE.TITLE'),
              text: this.translate.instant('MODALS.DELETE_USE_CASE.BODY', useCase as UseCaseDto),
              confirmText: this.translate.instant('MODALS.DELETE_USE_CASE.CONFIRM'),
              abortText: this.translate.instant('MODALS.DELETE_USE_CASE.ABORT'),
            },
          });
          return dialogRef.afterClosed();
        }),
      )
      .subscribe(dialogResult => {
        if (dialogResult) {
          this.loading = true;
          this.store.dispatch(UseCase.deleteUseCase({ id }));
          this.actions$.pipe(ofType(UseCase.deletedUseCase), take(1)).subscribe(res => {
            this.loading = false;
            this.passGuard = true;
            this.router.navigate(['/use-cases', res.id]);
          });
        }
      });
  }

  acceptOffer(accept: boolean) {
    this.loading = true;
    this.submit('order')
      .pipe(
        take(1),
        switchMap(useCase => {
          if (accept) {
            return of({ useCase });
          }
          return this.awaitComplete(
            () =>
              UseCase.changeUseCaseStatus({
                id: useCase.id,
                status: 'declined',
              }),
            UseCase.changedUseCaseStatus,
          );
        }),
        switchMap(({ useCase }) => {
          this.loading = false;
          const type = this.getConfirmType('order', accept);
          const dialogRef = this.dialog.open(UseCasesStepConfirmComponent, {
            data: { type },
            disableClose: true,
          });
          return dialogRef.afterClosed().pipe(map(res => [res, useCase.id] as [boolean, string]));
        }),
        take(1),
      )
      .subscribe(([dialogResult, id]) => {
        if (dialogResult) {
          this.passGuard = true;
          this.router.navigate(['/use-cases', id]);
        }
      });
  }

  getFormButtonName(step: UseCaseFormStep): string {
    if (step === 'initial-request' || step === 'detailed-request') {
      return 'ACTION.SUBMIT_REQUEST';
    } else if (step === 'initial-feasibility-check') {
      return 'ACTION.SUBMIT_FEEDBACK';
    }
    return 'ACTION.SUBMIT_OFFER';
  }

  getConfirmModal(
    step: UseCaseFormStep,
    accepted = true,
  ): MatDialogRef<UseCasesStepConfirmComponent | ConfirmComponent> {
    const type = this.getConfirmType(step, accepted);
    if (type) {
      return this.dialog.open(UseCasesStepConfirmComponent, {
        data: { type },
        disableClose: true,
      });
    }
    return this.dialog.open(ConfirmComponent, {
      data: {
        title: this.translate.instant('MODALS.STEP_SUBMITTED.TITLE'),
        text: this.translate.instant('MODALS.STEP_SUBMITTED.BODY'),
        confirmText: this.translate.instant('MODALS.STEP_SUBMITTED.CONFIRM'),
        hideAbort: true,
      },
      disableClose: true,
    });
  }

  private getConfirmType(step: UseCaseFormStep, accepted = true): StepConfirm | null {
    if (step === 'initial-feasibility-check' || step === 'offer') {
      return null;
    }
    if (step === 'order') {
      return accepted ? 'offer-accepted' : 'offer-declined';
    }
    return step;
  }

  private submit(step?: UseCaseFormStep): Observable<UseCaseDto> {
    const dto = this.configurator.getDto();
    const attachments = this.configurator.getAttachmentChanges();
    const declined = this.configurator.isDeclined;

    let continue$: Observable<{ useCase: UseCaseDto }>;
    const steps = this.configurator.getChangedSteps();

    if (this.useCaseId) {
      const id = this.useCaseId;
      continue$ = this.awaitComplete(
        () => UseCase.updateUseCase({ id, useCase: dto, steps }),
        UseCase.updatedUseCase,
      );
      continue$ = continue$.pipe(
        switchMap(({ useCase }) =>
          combineLatest([
            this.deleteAttachments(useCase, attachments.removed),
            this.updateAttachments(attachments.updated),
          ]).pipe(
            switchMap(() =>
              this.awaitComplete(
                () => UseCase.loadUseCase({ id: useCase.id }),
                UseCase.loadedUseCase,
              ),
            ),
            switchMap(res => this.uploadAttachments(res.useCase, attachments.added)),
            map(res => ({ useCase: res ? res.useCase : useCase })),
          ),
        ),
      );
      if (step) {
        // Dont complete the step when declined (to make sure it can be enabled later again).
        if (declined) {
          continue$ = this.awaitComplete(
            useCase => {
              const enable = useCase.status === 'declined';
              const status: UseCaseStatus = enable ? this.getStatusAfterEnable(step) : 'declined';
              return UseCase.changeUseCaseStatus({
                id: useCase.id,
                status,
              });
            },
            UseCase.changedUseCaseStatus,
            continue$,
          );
        } else {
          continue$ = this.awaitComplete(
            () => UseCase.completeUseCaseStep({ id, step }),
            UseCase.completedUseCaseStep,
            continue$,
          );
        }
      }
    } else {
      continue$ = this.awaitComplete(
        () => UseCase.addUseCase({ useCase: dto, steps }),
        UseCase.addedUseCase,
      );
      continue$ = continue$.pipe(
        switchMap(({ useCase }) =>
          combineLatest([
            this.deleteAttachments(useCase, attachments.removed),
            this.updateAttachments(attachments.updated),
            this.uploadAttachments(useCase, attachments.added),
          ]).pipe(mapTo({ useCase })),
        ),
      );
      if (step) {
        continue$ = this.awaitComplete(
          useCase => UseCase.completeUseCaseStep({ id: useCase.id, step }),
          UseCase.completedUseCaseStep,
          continue$,
        );
      }
    }

    return continue$.pipe(
      take(1),
      switchMap(({ useCase }) =>
        this.awaitComplete(() => UseCase.loadUseCase({ id: useCase.id }), UseCase.loadedUseCase),
      ),
      map(res => res.useCase),
      tap(useCase => this.configurator.init(useCase)),
    );
  }

  private uploadAttachments(useCase: UseCaseDto, candidates: AttachmentCandidate[]) {
    if (!candidates.length) {
      return of({ useCase });
    }

    let firstImgAttachment = [...useCase.attachments]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .find(a => a.type === 'image') as ImageAttachmentDto | AttachmentCandidate | undefined;
    if (!firstImgAttachment) {
      firstImgAttachment = [...candidates].find(a => a.type === 'image');
    }

    let first: ImageAttachmentDto | undefined;
    const obs = this.actions$.pipe(
      ofType(Attachment.addedUseCaseAttachment),
      tap(({ attachment }) => {
        if (attachment.type === 'image' && !first) {
          first = attachment as ImageAttachmentDto;
        }
      }),
      skip(candidates.length - 1),
      take(1),
      switchMap(() => {
        const image =
          firstImgAttachment && !isCandidate(firstImgAttachment)
            ? firstImgAttachment.refId
            : first?.refId;

        // Only update image if it changed.
        if (useCase.image === image) {
          return of(null);
        }

        return this.awaitComplete(
          () =>
            UseCase.updateUseCase({
              id: useCase.id,
              useCase: { image },
              steps: [],
            }),
          UseCase.updatedUseCase,
        );
      }),
      take(1),
      mapTo(null),
    );

    candidates.forEach(candidate =>
      this.store.dispatch(
        Attachment.addUseCaseAttachment({
          useCaseId: useCase.id,
          candidate,
        }),
      ),
    );
    return obs;
  }

  private updateAttachments(attachments: AttachmentDto[]) {
    if (!attachments.length) {
      return of(null);
    }

    attachments.forEach(a =>
      this.store.dispatch(Attachment.updateUseCaseAttachment({ attachmentId: a.id, dto: a })),
    );
    return this.actions$.pipe(
      ofType(Attachment.updatedUseCaseAttachment),
      skip(attachments.length - 1),
      take(1),
      mapTo(null),
    );
  }

  private deleteAttachments(useCase: UseCaseDto, attachments: AttachmentDto[]) {
    if (!attachments.length) {
      return of(null);
    }

    attachments.forEach(a =>
      this.store.dispatch(Attachment.deleteUseCaseAttachment({ attachmentId: a.id })),
    );
    const updateImg = attachments.some(a => a.refId === useCase.image);
    return this.actions$.pipe(
      ofType(Attachment.deletedUseCaseAttachment),
      skip(attachments.length - 1),
      take(1),
      switchMap(() => {
        if (updateImg) {
          const firstImgAttachment = [...useCase.attachments]
            .filter(a => !attachments.some(b => a.refId === b.refId))
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
            .find(a => a.type === 'image') as ImageAttachmentDto | undefined;
          // Deleted attachments included the image of the use case, we remove it.
          return this.awaitComplete(
            () =>
              UseCase.updateUseCase({
                id: useCase.id,
                useCase: { image: firstImgAttachment ? firstImgAttachment.refId : '' },
                steps: [],
              }),
            UseCase.updatedUseCase,
          );
        }
        return of(null);
      }),
    );
  }

  private getSteps(id?: string, useCase?: Partial<UseCaseDto>) {
    return STEPS.map(step => {
      const disabled = false;
      return {
        ...step,
        // Insert use case id into right segment part
        route: [...step.route.slice(0, id ? 2 : 1), id || 'new', ...step.route.slice(2)],
        disabled,
        subSteps: step.subSteps.map(s => ({ ...s, disabled })),
      };
    });
  }

  private getSegments(useCase?: Partial<UseCaseDto>, plantId?: string) {
    const segments: BreadCrumbSegment[] = [];

    if (useCase && plantId) {
      segments.push({
        name: this.translate.instant('NAVIGATION.BACK_TO_USE_CASES_OVERVIEW'),
        link: ['/plants', plantId, 'use-cases'],
        backButton: true,
      });
    } else {
      segments.push({
        name: this.translate.instant('NAVIGATION.BACK_TO_PLANTS_OVERVIEW'),
        link: ['/plants'],
        backButton: true,
      });
    }

    if (useCase && useCase.id) {
      return [
        ...segments,
        {
          name: useCase.name,
          link: ['/', ...this.route.snapshot.url.map(u => u.path)],
        },
      ];
    }
    return [
      ...segments,
      {
        name: this.translate.instant('NAVIGATION.NEW_USE_CASE'),
        link: ['/', ...this.route.snapshot.url.map(u => u.path)],
      },
    ];
  }

  private findStepByUrl(steps: FormStep[], url: string) {
    const index = steps.findIndex(step => url.includes('/' + step.form));
    return Math.max(index, 0);
  }

  private awaitComplete<T extends { useCase: UseCaseDto }>(
    fn: (useCase: UseCaseDto) => Action,
    complete: ActionCreator,
    obs$?: Observable<T>,
  ) {
    const continue$ = (obs$ || (of({}) as Observable<{ useCase: UseCaseDto }>)).pipe(
      tap(({ useCase }) => this.store.dispatch(fn(useCase))),
      switchMap(() => this.actions$),
      ofType(complete),
      take(1),
    );
    return continue$ as Observable<T>;
  }

  private getStatusAfterEnable(step: UseCaseFormStep): UseCaseStatus {
    return step === 'initial-feasibility-check' ? 'in-evaluation' : 'under-validation';
  }
}
