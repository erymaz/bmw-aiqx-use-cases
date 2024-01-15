import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { map, take } from 'rxjs/operators';
import { BreadCrumbSegment } from 'src/app/components/breadcrumb/breadcrumb.component';
import { Plant, State, UseCase } from 'src/app/store';

@Component({
  selector: 'app-plants',
  templateUrl: './plants.component.html',
  styleUrls: ['./plants.component.scss'],
})
export class PlantsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  segments: BreadCrumbSegment[] = [
    {
      name: this.translate.instant('NAVIGATION.BACK_TO_AIQX_HUB'),
      link: ['/'],
      backButton: true,
    },
    {
      name: this.translate.instant('NAVIGATION.PLANTS_OVERVIEW'),
      link: ['/', 'plants'],
    },
  ];

  plants$ = this.store.select(Plant.selectPlants).pipe(
    map(plants =>
      plants.map(p => ({
        ...p,
        useCasesNum$: this.store
          .select(UseCase.selectTableMeta(p.id))
          .pipe(map(meta => meta.paging.total)),
      })),
    ),
  );

  constructor(private store: Store<State>, private translate: TranslateService) {}

  ngOnInit(): void {
    this.store.dispatch(Plant.loadPlants());
    this.plants$.pipe(takeUntil(this.destroy$)).subscribe(plants =>
      // Set limit to 0 to not actually query use cases but just get the total number.
      // We exploit the table store and use the meta to get the total num of use cases per plant.
      plants.forEach(p =>
        this.store.dispatch(
          UseCase.loadUseCasesTable({ tableId: p.id, filter: { limit: 0, plantId: p.id } }),
        ),
      ),
    );
  }

  ngOnDestroy() {
    this.plants$
      .pipe(take(1))
      .subscribe(plants =>
        plants.forEach(p => this.store.dispatch(UseCase.removeUseCaseTable({ tableId: p.id }))),
      );

    this.destroy$.next();
    this.destroy$.complete();
  }
}
