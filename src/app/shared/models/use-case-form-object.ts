import { FormSelectOption } from './form';

export type BenefitType =
  | 'saving_manually_test'
  | 'saving_rework'
  | 'prevents_offline_rework'
  | 'specific_benefit'
  | 'other';

export type InspectionType =
  | 'correct_wrong_part'
  | 'correctly_installed_check'
  | 'exists_check'
  | 'variants_detections'
  | 'surface_check'
  | 'anomalies_check'
  | 'gap_size_check'
  | 'other';

export type FeaturePositionType = 'engine' | 'interieur' | 'exterieur' | 'wheels' | 'other';

export interface BenefitForm {
  savesManualTest: {
    durationTest: number;
    testedVehicles: number;
    costRate: number;
    resultingBenefit: number;
  };
  reducingInlineRework: {
    expectedReductionInlineRework: number;
    testedVehiclesPerYear: number;
    costRate: number;
    resultingBenefit: number;
  };
  reducingOfflineRework: {
    expectedReductionOfflineRework: number;
    reworkedVehicles: number;
    costRate: number;
    resultingBenefit: number;
  };
  reducingFieldCost: {
    expectedReductionFieldCost: number;
  };
  other: {
    value: string;
  };
}

export interface DefinitionForm {
  description: string;
  costsCoveredByDepartment: string;
  benefits: BenefitForm;
  biRating: number;
  reasonOfUrgency?: string;
  inspectionFeatureAvailable: {
    value: boolean;
    productionOrPreSeries: null | 'Already in production' | 'In running pre-series';
    partAvailableFrom: Date;
  };
}

export interface ProjectPlanning {
  targetDate: Date;

  requestorName: string;
  requestorDepartment: string;
  requestorFunction: string;
  requestorInformed: boolean;

  plannerName: string;
  plannerDepartment: string;
  plannerInformed: boolean;

  pspName: string;
  pspDepartment: string;
  pspInformed: boolean;

  qeName: string;
  qeDepartment: string;
  qeInformed: boolean;

  sectionName: string;
  sectionDepartment: string;
  sectionInformed: boolean;

  integrationOnExistingCamPossible: boolean;
  synergiesWithOtherUseCases: boolean;
}

export interface ProjectPlanningForm {
  completionDate: Date;
  requestor: ProjectPlanningGroup;
  planner: ProjectPlanningGroup;
  psp: ProjectPlanningGroup;
  qe: ProjectPlanningGroup;
  section: ProjectPlanningGroup;
}

export interface ProjectPlanningGroup {
  name: string;
  function?: FormSelectOption[];
  department: string;
  informed: boolean;
}

export interface FeatureDefinitionForm {
  cameraIntegration: boolean;
  typeOfInspection: {
    type: InspectionType;
    value: number | string;
  };
  featureSize: string;
  samePositionAndOrientation: boolean;
  cameraDistance: number;
  featureColor: string;
  haltedOrMoving: 'halted' | 'moving';
  numberOfVariants: number;
  positionInVehicle: {
    type: FeaturePositionType;
    value: string;
  };
}

export interface FeasibilityForm {
  feasibilityCheck: {
    value: boolean;
    text?: string;
  };
}

export type VariantIdentificationCriteria =
  | 'derivative'
  | 'part_number'
  | 'part_family'
  | 'option_code'
  | 'engine_type'
  | 'other';
export interface Variant {
  name: string;
  description: string;
  identificationCriteria: {
    values: VariantIdentificationCriteria[];
    text?: string;
  };
}

export interface VariantsForm {
  numberOfVariants: number;
  variants: Variant[];
}

export interface DetailForm {
  technicalTact: boolean;
  anonymizationNecessary: boolean;
  archivingImages: {
    value: boolean;
    months?: number;
  };
  emergencyConcept: boolean;
}

export interface ImplementationFeasibilityForm {
  implementationFeasibilityCheck: {
    value: boolean;
    text?: string;
  };
}

export interface ComplexityDefinitionForm {
  complexityForDataScience: Complexity;
  complexityForBusiness: Complexity;
  timelineForImplementation: Date;
}

export interface NumberOfTrainingImages {
  trainingImagesForOK: number;
  trainingImagesForNOK: number;
}

export interface CameraPositionDefinitionForm {
  cameraNecessary: {
    value: boolean;
    cameraHouseNecessary: string;
    definitionOfCamera: string;
    numberOfCameras: number;
    cameraPosition: {
      images: File[];
      position: string;
    };
  };
  edgeDeviceNecessary: {
    value: boolean;
    definitionOfEdgeDevice: string;
    numberOfEdgeDevices: number;
  };
  additionalLightingNecessary: {
    value: boolean;
    description: string;
  };
  hardwareCostEstimation: string;
  installationCost: string;
  numberOfPicturesTakenPerVehicle: number;
  numberOfTrainingImages: NumberOfTrainingImages[];
}

// tslint:disable-next-line
export interface EstimatedPriceForm {}

export interface UseCaseOrderForm {
  acceptNewImplementationDate: boolean;
}

export interface NeededSystemConfigurationForm {
  orderData: {
    value: string;
    description: string;
  };
  trigger: {
    value: string;
    description: string;
  };
  validationResult: {
    value: string;
    description: string;
  };
}

export interface InfrastructureForm {
  nsiSocketAvailable: boolean | 'unknown';
  powerAvailable: boolean | 'unknown';
  poeAvailable: boolean | 'unknown';
}

export interface FinalCameraLocationForm {
  mechanicalStructure: boolean;
}

export interface HardwareOrderingSetupForm {
  cameraIsCompleted: boolean;
}

export const COMPLEXITY = ['S', 'M', 'L'] as const;
export type Complexity = typeof COMPLEXITY[number];

export interface HardwareDefinitionForm {
  implementationFeasible: {
    value: boolean;
    reason: string;
  };

  complexityForDataScience: Complexity;
  complexityForBusiness: Complexity;
  timelineForImplementation: Date;
  useCasePricing: {
    currency: string;
    value: number;
  };

  definitionOfCamera: string;
  numberOfCameras: number;
  cameraPosition: {
    images: File[];
    position: string;
  };
  numberOfPicturesTakenPerVehicle: number;
  edgeDeviceNecessary: boolean;
  additionalLightingNecessary: {
    value: boolean;
    description: string;
  };
  trainingImagesForOK: number;
  trainingImagesForNOK: number;
}

export interface HardwareDetailsForm {
  ipName: string;
  ipAddress: string;
  subNetwork: string;
  gateway: string;

  cameraPartNumber: string;
  cameraInventoryNumber: string;
}

export const USE_CASE_FORM_STEPS = [
  'initial-request',
  'initial-feasibility-check',
  'detailed-request',
  'offer',
  'order',
  // 'hardware-details',
] as const;

export type UseCaseFormStep = typeof USE_CASE_FORM_STEPS[number];

interface UseCaseStep<T extends UseCaseFormStep, R extends object> {
  type: T;
  form: Partial<R>;
  completedAt?: Date;
  createdBy?: string;
}

export type InitialRequestStep = UseCaseStep<
  'initial-request',
  DefinitionForm & ProjectPlanningForm & FeatureDefinitionForm
>;
export type InitialFeasibilityCheckStep = UseCaseStep<'initial-feasibility-check', FeasibilityForm>;
export type DetailedRequestStep = UseCaseStep<
  'detailed-request',
  VariantsForm &
    FinalCameraLocationForm &
    InfrastructureForm &
    DetailForm &
    NeededSystemConfigurationForm
>;
export type OfferStep = UseCaseStep<
  'offer',
  ImplementationFeasibilityForm & HardwareDefinitionForm & CameraPositionDefinitionForm
>;
export type OrderStep = UseCaseStep<'order', {}>;

export type UseCaseStepDto =
  | InitialRequestStep
  | InitialFeasibilityCheckStep
  | DetailedRequestStep
  | OfferStep
  | OrderStep;

export type UseCaseFormStepTuple = [UseCaseFormStep, UseCaseStepDto['form']];

// export const USE_CASES_STEP_CONFIRM_MODALS = [
//   'initial-request',
//   'initial-feasibility-check',
//   'detailed-request',
//   'offer-accepted',
//   'offer-declined',
//   'order'
// ] as const;
