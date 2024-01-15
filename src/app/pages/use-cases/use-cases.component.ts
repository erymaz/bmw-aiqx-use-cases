import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { BreadCrumbSegment } from 'src/app/components/breadcrumb/breadcrumb.component';
import { UseCaseFilter } from 'src/app/shared';
import { AuthService } from 'src/app/shared/services/auth.service';

@Component({
  selector: 'app-use-cases',
  templateUrl: './use-cases.component.html',
  styleUrls: ['./use-cases.component.scss'],
})
export class UseCasesComponent implements OnInit {
  segments: BreadCrumbSegment[] = [];
  plantId$ = combineLatest([this.route.params, this.route.queryParams]).pipe(
    map(([params, queryParams]) => params['plantId'] || queryParams['plantId']),
  );
  q$ = new BehaviorSubject<string | undefined>(undefined);
  filter$ = combineLatest([this.plantId$, this.q$]).pipe(
    map(([plantId, q]) => {
      if (q && q.length) {
        return { plantId, q };
      }
      return { plantId };
    }),
    startWith({}),
  ) as Observable<UseCaseFilter>;

  constructor(
    private route: ActivatedRoute,
    private translate: TranslateService,
    public authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.segments = [
      {
        name: this.translate.instant('NAVIGATION.BACK_TO_AIQX_HUB'),
        link: ['/'],
        backButton: true,
      },
      {
        name: this.translate.instant('NAVIGATION.PLANTS_OVERVIEW'),
        link: ['/', 'plants'],
      },
      {
        name: this.route.snapshot.url[1]?.path,
        link: ['/', ...this.route.snapshot.url.map(u => u.path)],
      },
    ];
  }
}
