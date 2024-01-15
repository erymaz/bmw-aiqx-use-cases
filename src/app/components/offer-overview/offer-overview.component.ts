import { Component, Input, OnInit } from '@angular/core';
import {
  OfferStep,
  SUB_STEPS_MAP,
  UseCaseCalculatorService,
  UseCaseConfiguratorService,
  UseCaseDto,
  UseCaseFormSubStep,
} from 'src/app/shared';

@Component({
  selector: 'app-offer-overview',
  templateUrl: './offer-overview.component.html',
  styleUrls: ['./offer-overview.component.scss'],
})
export class OfferOverviewComponent implements OnInit {
  @Input()
  formStep!: Partial<OfferStep['form']>;

  @Input()
  useCase!: UseCaseDto;

  init = false;

  constructor(public calc: UseCaseCalculatorService) {}

  async ngOnInit() {
    await this.calc.init();
    this.init = true;
  }

  getStepUrl(subStep: UseCaseFormSubStep) {
    const entry = Object.entries(SUB_STEPS_MAP).find(([, value]) => value.includes(subStep));
    return entry ? entry[0] : '';
  }
}
