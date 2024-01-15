import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { catchError, concatMap, map, mapTo, mergeMap, switchMap } from 'rxjs/operators';
import { FileService, UseCaseService } from 'src/app/shared';

import * as AttachmentActions from './attachment.actions';

@Injectable()
export class AttachmentEffects {
  private tryDeleteFile(fileId: string, action: Action): Observable<Action> {
    return this.fileService.deleteFile(fileId).pipe(
      mapTo(action),
      catchError(() => of(action)),
    );
  }

  addUseCaseAttachment$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttachmentActions.addUseCaseAttachment),
      concatMap(({ useCaseId, candidate: { file, ...attachment } }) =>
        this.fileService
          .uploadFile({ file, tags: ['attachment', 'image'], refIds: [useCaseId] })
          .pipe(
            switchMap(fileRes =>
              this.useCaseService
                .addUseCaseAttachment(useCaseId, { ...attachment, refId: fileRes.id })
                .pipe(
                  map(attRes => AttachmentActions.addedUseCaseAttachment({ attachment: attRes })),
                  // Try to delete the file uploaded if attachment creation fails.
                  catchError(error =>
                    this.tryDeleteFile(
                      fileRes.id,
                      AttachmentActions.failedAddingUseCaseAttachment({ useCaseId, error }),
                    ),
                  ),
                ),
            ),
            catchError(error =>
              of(AttachmentActions.failedAddingUseCaseAttachment({ useCaseId, error })),
            ),
          ),
      ),
    ),
  );

  loadUseCaseAttachments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttachmentActions.loadUseCaseAttachments),
      mergeMap(({ useCaseId }) =>
        this.useCaseService.getUseCaseAttachments(useCaseId).pipe(
          map(attachments => AttachmentActions.loadedUseCaseAttachments({ attachments })),
          catchError(error =>
            of(AttachmentActions.failedLoadingUseCaseAttachments({ useCaseId, error })),
          ),
        ),
      ),
    ),
  );

  updateUseCaseAttachments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttachmentActions.updateUseCaseAttachment),
      mergeMap(({ attachmentId, dto }) =>
        this.useCaseService.updateUseCaseAttachment(attachmentId, dto).pipe(
          map(attachment => AttachmentActions.updatedUseCaseAttachment({ attachment })),
          catchError(error =>
            of(AttachmentActions.failedUpdatingUseCaseAttachment({ attachmentId, error })),
          ),
        ),
      ),
    ),
  );

  deleteUseCaseAttachments$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AttachmentActions.deleteUseCaseAttachment),
      mergeMap(({ attachmentId }) =>
        this.useCaseService.deleteUseCaseAttachment(attachmentId).pipe(
          map(() => AttachmentActions.deletedUseCaseAttachment({ attachmentId })),
          catchError(error =>
            of(AttachmentActions.failedDeletingUseCaseAttachment({ attachmentId, error })),
          ),
        ),
      ),
    ),
  );

  constructor(
    private actions$: Actions,
    private useCaseService: UseCaseService,
    private fileService: FileService,
  ) {}
}
