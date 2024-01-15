import { Component, Input, OnInit } from '@angular/core';
import {
  AttachmentDto,
  DetailedRequestStep,
  SUB_STEPS_MAP,
  UseCaseConfiguratorService,
  UseCaseDto,
  UseCaseFormSubStep,
  Variant,
} from 'src/app/shared';

@Component({
  selector: 'app-detailed-request-overview',
  templateUrl: './detailed-request-overview.component.html',
  styleUrls: ['./detailed-request-overview.component.scss'],
})
export class DetailedRequestOverviewComponent implements OnInit {
  @Input()
  formStep!: Partial<DetailedRequestStep['form']>;

  @Input()
  useCase!: UseCaseDto;

  @Input()
  attachments: AttachmentDto[] = [];

  @Input()
  variants: Variant[] = [];

  constructor(public configurator: UseCaseConfiguratorService) {}

  ngOnInit(): void {}

  getStepUrl(subStep: UseCaseFormSubStep) {
    const entry = Object.entries(SUB_STEPS_MAP).find(([, value]) => value.includes(subStep));
    return entry ? entry[0] : '';
  }
}
