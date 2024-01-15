import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';

@Injectable()
export class AppEffects {
  // tslint:disable-next-line: no-unused-variable
  constructor(private readonly actions$: Actions) {}
}
