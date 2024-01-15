import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { BreadCrumbSegment } from 'src/app/components/breadcrumb/breadcrumb.component';
import { ConfirmComponent } from 'src/app/modals/confirm/confirm.component';
import {
  AnimatedUseCaseStep,
  DetailedRequestStep,
  ImageAttachmentDto,
  InitialRequestStep,
  PlantDto,
  STEPS,
  SUB_STEPS_MAP,
  UseCaseDto,
  UseCaseFormStep,
  UseCaseFormSubStep,
  UseCaseStatus,
  UserRole,
  USE_CASE_FORM_STEPS,
  USE_CASE_STATUS_COLORS,
  USE_CASE_STATUS_LABELS,
  USE_CASE_STEPS_ROLES_MAP,
  VariantAttachmentDto,
} from 'src/app/shared';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Plant, State, UseCase } from 'src/app/store';

@Component({
  selector: 'app-use-case-progress',
  templateUrl: './use-case-progress.component.html',
  styleUrls: ['./use-case-progress.component.scss'],
})
export class UseCaseProgressComponent implements OnInit {
  plant?: PlantDto;
  useCase!: UseCaseDto;
  segments: BreadCrumbSegment[] = [];
  steps = STEPS;
  exampleAttachments: ImageAttachmentDto[] = [];
  variantAttachments: VariantAttachmentDto[] = [];

  useCase$ = this.route.data.pipe(map(data => data.useCase as UseCaseDto | undefined));
  plant$ = this.useCase$.pipe(
    switchMap(useCase =>
      useCase ? this.store.select(Plant.selectPlantById(this.useCase.plantId)) : of(undefined),
    ),
  );
  steps$ = combineLatest([this.useCase$, this.authService.role$]).pipe(
    map(([useCase, role]) => (useCase ? this.getSteps(useCase, role) : [])),
  );
  currentStepIndex$ = combineLatest([this.steps$, this.useCase$]).pipe(
    map(([steps, useCase]) => this.getCurrentStepIndex(steps, useCase)),
  );
  currentForm$ = combineLatest([this.steps$, this.currentStepIndex$]).pipe(
    map(([steps, index]) => steps[index]?.name || steps[0].name),
  );

  get canDelete() {
    if (this.authService.isAIQXTeam) {
      return true;
    }
    const started = this.useCase.steps.some(s => !!s.completedAt);
    return this.authService.me?.id === this.useCase.createdBy && !started;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<State>,
    private authService: AuthService,
    private translate: TranslateService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(Plant.loadPlants());

    this.route.data
      .pipe(
        tap(data => {
          this.useCase = data.useCase;
          this.exampleAttachments = this.useCase.attachments.filter(
            a => a.type === 'image',
          ) as ImageAttachmentDto[];
          this.variantAttachments = this.useCase.attachments.filter(
            a => a.type === 'variant',
          ) as VariantAttachmentDto[];
        }),
        switchMap(() => this.store.select(Plant.selectPlantById(this.useCase.plantId))),
      )
      .subscribe(plant => (this.plant = plant));

    this.segments = [
      {
        name: this.translate.instant('NAVIGATION.BACK_TO_USE_CASES_OVERVIEW'),
        link: this.plant ? ['/plants', this.plant.id, 'use-cases'] : ['/'],
        backButton: true,
      },
      {
        name: this.useCase.name,
        link: ['/', ...this.route.snapshot.url.map(u => u.path)],
      },
    ];
  }

  canEdit(form: UseCaseFormStep) {
    const role = this.authService.role;
    if (role === 'AIQX_TEAM') {
      return true;
    }
    if (this.useCase.status === 'declined') {
      return false;
    }
    return !form || USE_CASE_STEPS_ROLES_MAP[role].includes(form);
  }

  deleteUseCase() {
    const dialogRef = this.dialog.open(ConfirmComponent, {
      data: {
        title: this.translate.instant('MODALS.DELETE_USE_CASE.TITLE'),
        text: this.translate.instant('MODALS.DELETE_USE_CASE.BODY', this.useCase),
        confirmText: this.translate.instant('MODALS.DELETE_USE_CASE.CONFIRM'),
        abortText: this.translate.instant('MODALS.DELETE_USE_CASE.ABORT'),
      },
    });

    dialogRef.afterClosed().subscribe(dialogResult => {
      if (dialogResult) {
        this.store.dispatch(UseCase.deleteUseCase({ id: this.useCase.id }));
        this.router.navigateByUrl(`plants/${this.useCase.plantId}/use-cases`);
      }
    });
  }

  getSteps(useCase: UseCaseDto, role: UserRole): AnimatedUseCaseStep[] {
    const completedSteps = useCase.steps.filter(s => !!s.completedAt);
    const firstIncomplete = [...USE_CASE_FORM_STEPS].find(
      step => !completedSteps.some(s => s.type === step),
    );
    const roleSteps = USE_CASE_STEPS_ROLES_MAP[role];
    return [...USE_CASE_FORM_STEPS].map<AnimatedUseCaseStep>((step, i) => {
      const completedStep = useCase.steps.find(s => s.type === step);
      const declined = useCase.status === 'declined';
      const completed = completedSteps.length === USE_CASE_FORM_STEPS.length;
      return {
        name: step,
        doneDate: completedStep?.completedAt,
        doneBy: completedStep?.createdBy || '',
        error: declined && i === completedSteps.length - (completed ? 1 : 0),
        actionRoute:
          !declined && step === firstIncomplete && roleSteps.includes(step)
            ? this.getStepRoute(useCase.id, firstIncomplete)
            : undefined,
      };
    });
  }

  getStepUrl(subStep: UseCaseFormSubStep) {
    const entry = Object.entries(SUB_STEPS_MAP).find(([, value]) => value.includes(subStep));
    return entry ? entry[0] : '';
  }

  getStatusLabel(status: UseCaseStatus) {
    return USE_CASE_STATUS_LABELS[status];
  }

  getStatusColor(status: UseCaseStatus) {
    return USE_CASE_STATUS_COLORS[status];
  }

  getDescription(useCase: UseCaseDto) {
    const step = useCase.steps.find(s => s.type === 'initial-request');
    if (step) {
      return (step as InitialRequestStep).form.description || '';
    }
    return '';
  }

  getVariants(useCase: UseCaseDto) {
    const step = useCase.steps.find(s => s.type === 'detailed-request');
    if (step) {
      return (step as DetailedRequestStep).form.variants || [];
    }
    return [];
  }

  getFormStep(form: UseCaseFormStep): Partial<InitialRequestStep['form']> {
    const step = this.useCase.steps.find(s => s.type === form);
    if (step) {
      return (step as InitialRequestStep).form || {};
    }
    return {};
  }

  private getStepRoute(useCaseId: string, firstIncomplete: UseCaseFormStep) {
    return ['/use-cases', 'edit', useCaseId, firstIncomplete];
  }

  private getCurrentStepIndex(steps: AnimatedUseCaseStep[], useCase?: UseCaseDto) {
    const completedSteps = (useCase?.steps || []).filter(s => !!s.completedAt);
    return completedSteps.length;
  }
}
