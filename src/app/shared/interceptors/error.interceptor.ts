import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private snackBar: MatSnackBar) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(catchError(err => this.handleError(err)));
  }

  private handleError(err: HttpErrorResponse): Observable<HttpEvent<unknown>> {
    if (![401].includes(err.status)) {
      const message = err.error?.detail;
      this.snackBar.open(message ? message : 'Server Error', undefined, {
        duration: 2500,
        panelClass: ['notification'],
        verticalPosition: 'top',
        horizontalPosition: 'right',
      });
    }
    return throwError(err);
  }
}
