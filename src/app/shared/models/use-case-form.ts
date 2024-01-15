import { StepAnimationMetadata } from 'src/app/util';

import { UseCaseFormStep } from './use-case-form-object';
import { UserRole } from './user';

export interface AnimatedUseCaseStep {
  name: UseCaseFormStep;
  doneBy: string;
  doneDate?: Date;
  actionRoute?: string[];
  error: boolean;
  animationMetadata?: StepAnimationMetadata;
}

export const USE_CASE_FORM_NAME_MAP: { [key in UseCaseFormStep]: string } = {
  'initial-request': 'FORMS.TITLES.INITIAL_REQUEST',
  'initial-feasibility-check': 'FORMS.TITLES.INITIAL_FEASIBILITY_CHECK',
  'detailed-request': 'FORMS.TITLES.DETAILED_REQUEST',
  offer: 'FORMS.TITLES.USE_CASE_OFFER',
  order: 'FORMS.TITLES.USE_CASE_ORDER',
  // 'hardware-details': 'Hardware Definition',
};

export const USE_CASE_STEPS_ROLES_MAP: { [key in UserRole]: UseCaseFormStep[] } = {
  AIQX_TEAM: ['initial-feasibility-check', 'offer'], // 'hardware-details'],
  REQUESTOR: ['initial-request', 'detailed-request', 'order'],
};

export const SUB_STEPS_MAP: { [key in UseCaseFormStep]: UseCaseFormSubStep[] } = {
  'initial-request': ['description', 'project_planning', 'feature_definition', 'example_images'],
  'initial-feasibility-check': ['feasibility_check'],
  'detailed-request': [
    'variants',
    'camera_location',
    'infrastructure',
    'details',
    'system_configuration',
  ],
  offer: [
    'implementation_feasibility_check',
    'complexity_definition',
    'camera_position_definition',
    'estimated_price',
  ],
  order: ['order'],
  // 'hardware-details': ['camera_location', 'order', 'offer'],
};

export type UseCaseFormSubStep =
  | 'description'
  | 'project_planning'
  | 'feature_definition'
  | 'feasibility_check'
  | 'example_images'
  | 'variants'
  | 'details'
  | 'system_configuration'
  | 'infrastructure'
  | 'implementation_feasibility_check'
  | 'complexity_definition'
  | 'camera_position_definition'
  | 'estimated_price'
  | 'camera_location'
  | 'hardware_order'
  | 'order'
  | 'hardware_details';

export const EXAMPLE_IMAGES_COUNT = 2;
// export interface UseCaseForm
//   extends Pick<UseCaseDto, 'name' | 'plantId' | 'building' | 'line' | 'position'>,
//     UseCaseFormObject {
//   attachments: Array<AttachmentCandidate | AttachmentDto>;
// }
