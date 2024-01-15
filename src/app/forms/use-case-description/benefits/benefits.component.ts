import { Component, forwardRef, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BENEFITS_OPTS, DefinitionForm, UseCaseConfiguratorService } from 'src/app/shared';

type BenefitForm = DefinitionForm['benefits'];
type Benefit = keyof BenefitForm;

const BENEFITS_CONTROL_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => BenefitsComponent),
  multi: true,
};

const BENEFITS_VALIDATORS = {
  provide: NG_VALIDATORS,
  useExisting: forwardRef(() => BenefitsComponent),
  multi: true,
};

const CALCULATED_BENEFITS: Benefit[] = [
  'savesManualTest',
  'reducingInlineRework',
  'reducingOfflineRework',
];

@Component({
  selector: 'app-benefits',
  templateUrl: './benefits.component.html',
  styleUrls: ['./benefits.component.scss'],
  providers: [BENEFITS_CONTROL_ACCESSOR, BENEFITS_VALIDATORS],
})
export class BenefitsComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private onTouch!: () => void;
  private onModalChange!: (value: BenefitForm) => void;
  private destroyed$ = new Subject<void>();

  form!: FormGroup;
  openedFields: Benefit[] = [];
  isDisabled = false;

  fields = BENEFITS_OPTS;

  get savesManualTest(): AbstractControl {
    return this.form.get('savesManualTest') as AbstractControl;
  }

  get reducingInlineRework(): AbstractControl {
    return this.form.get('reducingInlineRework') as AbstractControl;
  }

  get reducingOfflineRework(): AbstractControl {
    return this.form.get('reducingOfflineRework') as AbstractControl;
  }

  get reducingFieldCost(): AbstractControl {
    return this.form.get('reducingFieldCost') as AbstractControl;
  }

  get other(): AbstractControl {
    return this.form.get('other') as AbstractControl;
  }

  constructor(private fb: FormBuilder, private configurator: UseCaseConfiguratorService) {}

  ngOnInit(): void {
    this.form = this.buildForm();
    const { benefits } = this.configurator.getStep('initial-request');
    this.openedFields = Object.keys(benefits || {}).filter(b =>
      Object.values(((benefits || {}) as BenefitForm)[b as Benefit]).some(
        v => v !== null || v !== 0,
      ),
    ) as Benefit[];

    Object.keys(this.form.controls).forEach(f => {
      if (!this.openedFields.includes(f as Benefit)) {
        this.getControl(f as Benefit).disable();
      }
    });

    this.form.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
      if (this.onTouch) {
        this.onTouch();
      }
      if (this.onModalChange) {
        this.onModalChange(this.openedFields.length < 1 ? null : value);
      }
    });

    CALCULATED_BENEFITS.forEach(b => {
      const formGroup = this.getControl(b) as FormGroup;
      formGroup.valueChanges.pipe(takeUntil(this.destroyed$)).subscribe(value => {
        const [x1, x2, x3] = Object.values(value);
        const resultingBenefit = ((x1 / 60) * x2 * x3).toFixed(2);
        formGroup.get('resultingBenefit')?.setValue(resultingBenefit, { emitEvent: false });
      });
    });
  }

  fieldsKeyvalueOrder(): number {
    return 0;
  }

  onSelect(benefit: Benefit, checked: boolean): void {
    if (this.openedFields.includes(benefit)) {
      this.openedFields = this.openedFields.filter(f => f !== benefit);
    } else {
      this.openedFields.push(benefit);
    }

    const ctrl = this[benefit];
    !checked ? ctrl.disable() : ctrl.enable();

    // if (!ctrl.disabled) {
    //   switch (benefit) {
    //     case 'savesManualTest':
    //     case 'reducingInlineRework':
    //     case 'reducingOfflineRework':
    //       return ctrl.get('resultingBenefit')?.disable();
    //     default:
    //       return;
    //   }
    // }
  }

  getControl(benefit: Benefit) {
    return this[benefit];
  }

  validate(): ValidationErrors | null {
    return this.form.invalid ? { error: true } : null;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    isDisabled ? this.form.disable() : this.form.enable();

    // if (!isDisabled) {
    //   this.openedFields.forEach(f => {
    //     const ctrl = this.getControl(f);
    //     ctrl.get('resultingBenefit')?.disable();
    //   });
    // }
  }

  writeValue(value: BenefitForm | null): void {
    if (value) {
      this.form.setValue({
        ...Object.entries(this.fields).reduce(
          (prev, [key, v]) => ({
            ...prev,
            [key]: (v.subfields as { name: string }[])
              .map(s => s.name)
              .reduce((a, b) => ({ ...a, [b]: null }), {}),
          }),
          {},
        ),
        ...value,
      });
    }
  }

  registerOnChange(fn: (value: BenefitForm) => void): void {
    this.onModalChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      savesManualTest: this.fb.group({
        durationTest: [null, Validators.min(1)],
        testedVehicles: [null, Validators.min(1)],
        costRate: [null, Validators.min(0)],
        resultingBenefit: [null, Validators.min(0)],
      }),
      reducingInlineRework: this.fb.group({
        expectedReductionInlineRework: [null, Validators.min(1)],
        testedVehiclesPerYear: [null, Validators.min(1)],
        costRate: [null, Validators.min(0)],
        resultingBenefit: [null, Validators.min(0)],
      }),
      reducingOfflineRework: this.fb.group({
        expectedReductionOfflineRework: [null, Validators.min(1)],
        reworkedVehicles: [null, Validators.min(1)],
        costRate: [null, Validators.min(0)],
        resultingBenefit: [null, Validators.min(0)],
      }),
      reducingFieldCost: this.fb.group({
        expectedReductionFieldCost: [null, Validators.min(1)],
      }),
      other: this.fb.group({
        value: [null],
      }),
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
