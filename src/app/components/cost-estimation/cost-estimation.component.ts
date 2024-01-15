import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { CombinationForCosts, Costs, OfferStep, UseCaseCalculatorService } from 'src/app/shared';

interface CombinationData {
  combination_implementation: CombinationForCosts;
  combination_yearly: CombinationForCosts;
}

@Component({
  selector: 'app-cost-estimation',
  templateUrl: './cost-estimation.component.html',
  styleUrls: ['./cost-estimation.component.scss'],
})
export class CostEstimationComponent implements OnInit {
  @Input()
  offer!: Partial<OfferStep['form']>;

  init = false;

  constructor(public calc: UseCaseCalculatorService) {}

  async ngOnInit() {
    await this.calc.init();
    this.init = true;
  }
}
