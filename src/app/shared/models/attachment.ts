import { CreateDto, UpdateDto } from 'src/app/util';

import { BaseDto } from './base';

export interface AttachmentDto<T = object, R = string> extends BaseDto {
  refId: string;
  type: R;
  metadata: T;
  useCaseId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateAttachmentDto = Omit<CreateDto<AttachmentDto>, 'useCaseId'>;
export type UpdateAttachmentDto = Omit<UpdateDto<AttachmentDto>, 'useCaseId'>;

export interface ImageMetadata {
  isOK: boolean | null;
  description: string | null;
}
export interface ImageAttachmentDto extends AttachmentDto<ImageMetadata, 'image'> {}

export type CreateImageAttachmentDto = Omit<CreateDto<ImageAttachmentDto>, 'useCaseId'>;

export interface ImageAttachmentCandidate extends Omit<CreateImageAttachmentDto, 'refId'> {
  file: File;
}

export interface VariantMetadata {
  isOK: boolean | null;
  variantIndex: number;
}
export interface VariantAttachmentDto extends AttachmentDto<VariantMetadata, 'variant'> {}

export type CreateVariantAttachmentDto = Omit<CreateDto<VariantAttachmentDto>, 'useCaseId'>;

export interface VariantAttachmentCandidate extends Omit<CreateVariantAttachmentDto, 'refId'> {
  file: File;
}

export type AttachmentCandidate = ImageAttachmentCandidate | VariantAttachmentCandidate;

export function isCandidate<T extends AttachmentCandidate>(input: T | AttachmentDto): input is T {
  return 'file' in input && input.file instanceof File;
}
