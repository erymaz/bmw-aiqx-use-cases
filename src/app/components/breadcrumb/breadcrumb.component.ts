import { Component, Input } from '@angular/core';

export interface BreadCrumbSegment {
  name: string;
  link: string[];
  backButton?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent {
  @Input()
  segments: BreadCrumbSegment[] = [];
}
