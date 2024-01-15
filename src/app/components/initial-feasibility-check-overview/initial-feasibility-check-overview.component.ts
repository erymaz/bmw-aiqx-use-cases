import { Component, Input, OnInit } from '@angular/core';
import {
  InitialFeasibilityCheckStep,
  SUB_STEPS_MAP,
  UseCaseConfiguratorService,
  UseCaseDto,
  UseCaseFormSubStep,
} from 'src/app/shared';

@Component({
  selector: 'app-initial-feasibility-check-overview',
  templateUrl: './initial-feasibility-check-overview.component.html',
  styleUrls: ['./initial-feasibility-check-overview.component.scss'],
})
export class InitialFeasibilityCheckOverviewComponent implements OnInit {
  @Input()
  formStep!: Partial<InitialFeasibilityCheckStep['form']>;

  @Input()
  useCase!: UseCaseDto;

  constructor(public configurator: UseCaseConfiguratorService) {}

  ngOnInit(): void {}

  getStepUrl(subStep: UseCaseFormSubStep) {
    const entry = Object.entries(SUB_STEPS_MAP).find(([, value]) => value.includes(subStep));
    return entry ? entry[0] : '';
  }
}
