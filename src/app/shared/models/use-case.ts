import { CreateDto, UpdateDto } from 'src/app/util';

import { AttachmentDto } from './attachment';
import { BaseDto } from './base';
import { UseCaseStepDto } from './use-case-form-object';

export type UseCaseStatus =
  | 'live'
  | 'in-evaluation'
  | 'under-validation'
  | 'in-implementation'
  | 'declined';

export const USE_CASE_STATUS_LABELS: Record<UseCaseStatus, string> = {
  live: 'USE_CASE.STATUS.LIVE',
  'in-evaluation': 'USE_CASE.STATUS.IN_EVALUATION',
  'under-validation': 'USE_CASE.STATUS.UNDER_VALIDATION',
  'in-implementation': 'USE_CASE.STATUS.IN_IMPLEMENTATION',
  declined: 'USE_CASE.STATUS.DECLINED',
};

export const USE_CASE_STATUS_COLORS: Record<UseCaseStatus, string> = {
  live: '#3db014',
  'in-evaluation': '#1c69d4',
  'under-validation': '#ffb600',
  'in-implementation': '#1a1f27',
  declined: '#d20000',
};

export interface UseCaseDto extends BaseDto {
  name: string;
  plantId: string;
  building: string;
  line: string;
  position: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: UseCaseStatus;
  attachments: AttachmentDto[];
  steps: UseCaseStepDto[];
}

export type CreateUseCaseDto = Omit<CreateDto<UseCaseDto>, 'status' | 'attachments' | 'steps'>;
export type UpdateUseCaseDto = UpdateDto<CreateUseCaseDto>;

export interface UseCaseFilter {
  q?: string;
  limit?: number;
  page?: number;
  sort?: string;
  plantId?: string;
}

export function getUseCaseName(plantId: string, building: string, name: string) {
  if (plantId && building && name) {
    return `${plantId}-H${building}-${name}`;
  }
  return name;
}

export function extractUseCaseName(name: string) {
  return name.split('-').splice(2).join('');
}
