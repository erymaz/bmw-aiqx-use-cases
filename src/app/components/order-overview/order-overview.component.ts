import { Component, Input, OnInit } from '@angular/core';
import {
  OfferStep,
  OrderStep,
  SUB_STEPS_MAP,
  UseCaseCalculatorService,
  UseCaseConfiguratorService,
  UseCaseDto,
  UseCaseFormSubStep,
} from 'src/app/shared';

@Component({
  selector: 'app-order-overview',
  templateUrl: './order-overview.component.html',
  styleUrls: ['./order-overview.component.scss'],
})
export class OrderOverviewComponent implements OnInit {
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
