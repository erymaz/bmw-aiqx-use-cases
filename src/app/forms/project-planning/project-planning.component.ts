import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  ProjectPlanningForm,
  PROJECT_PLANNING_GROUPS,
  UseCaseConfiguratorService,
  UseCaseDto,
} from 'src/app/shared';
import { FormDirective } from 'src/app/util';

@Component({
  selector: 'app-project-planning',
  templateUrl: './project-planning.component.html',
  styleUrls: ['./project-planning.component.scss'],
})
export class ProjectPlanningComponent
  extends FormDirective<ProjectPlanningForm, UseCaseDto>
  implements OnInit {
  groups = PROJECT_PLANNING_GROUPS;

  constructor(protected fb: FormBuilder, private configurator: UseCaseConfiguratorService) {
    super(fb);
  }

  ngOnInit() {
    super.ngOnInit();
    this.configurator.register('project_planning', this.form);
  }

  protected buildForm(): FormGroup {
    return this.fb.group({
      completionDate: [null, Validators.required],
      requestor: [null, Validators.required],
      planner: [null],
      psp: [null],
      qe: [null],
      section: [null],
    });
  }
}
