import { Component, Input, OnInit } from '@angular/core';
import {
  DefinitionForm,
  ImageAttachmentDto,
  InitialRequestStep,
  SUB_STEPS_MAP,
  UseCaseConfiguratorService,
  UseCaseDto,
  UseCaseFormSubStep,
} from 'src/app/shared';
import {
  BENEFITS_OPTS,
  POSITION_IN_VEHICLE_OPTS,
  TYPE_OF_INSPECTION_OPTS,
} from 'src/app/shared/models/use-case-form-definitions';

type BenefitForm = DefinitionForm['benefits'];
type Benefit = keyof BenefitForm;

@Component({
  selector: 'app-initial-request-overview',
  templateUrl: './initial-request-overview.component.html',
  styleUrls: ['./initial-request-overview.component.scss'],
})
export class InitialRequestOverviewComponent implements OnInit {
  @Input()
  formStep!: Partial<InitialRequestStep['form']>;

  @Input()
  useCase!: UseCaseDto;

  @Input()
  exampleAttachments!: ImageAttachmentDto[];

  benefitFields = BENEFITS_OPTS;
  typeOfInspectionOptions = TYPE_OF_INSPECTION_OPTS;
  positionInVehicleOptions = POSITION_IN_VEHICLE_OPTS;

  constructor(public configurator: UseCaseConfiguratorService) {}

  ngOnInit(): void {}

  getStepUrl(subStep: UseCaseFormSubStep) {
    const entry = Object.entries(SUB_STEPS_MAP).find(([, value]) => value.includes(subStep));
    return entry ? entry[0] : '';
  }

  getBenefitValues(benefits?: BenefitForm) {
    return Object.entries(benefits || {}).map(([key, value]) => ({ key, value }));
  }

  getBenefitField(key: Benefit) {
    return this.benefitFields[key];
  }

  getTypeLabel(type: string): string {
    const temp = this.typeOfInspectionOptions.find(el => el.value === type);
    if (temp) {
      return temp.label;
    } else {
      return '';
    }
  }

  getPositionInVehicleLabel(name: string): string {
    const temp = this.positionInVehicleOptions.find(el => el.value === name);
    if (temp) {
      return temp.label;
    } else {
      return '';
    }
  }

  getBoolean(value?: boolean | string): string | null {
    if (typeof value === 'string') {
      return null;
    }
    if (typeof value === 'boolean') {
      return value ? 'LABEL.YES' : 'LABEL.NO';
    }
    return '';
  }
}
