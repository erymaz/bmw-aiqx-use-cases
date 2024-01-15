import { Component, EventEmitter, forwardRef, OnDestroy, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { uniqBy } from 'lodash-es';
import { FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { Subject } from 'rxjs';

const FILE_UPLOADER_DROPDOWN_CONTROL_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FileUploaderDropdownComponent),
  multi: true,
};

@Component({
  selector: 'app-file-uploader-dropdown',
  templateUrl: './file-uploader-dropdown.component.html',
  styleUrls: ['./file-uploader-dropdown.component.scss'],
  providers: [FILE_UPLOADER_DROPDOWN_CONTROL_ACCESSOR],
})
export class FileUploaderDropdownComponent implements ControlValueAccessor, OnDestroy {
  private onTouch: () => void = () => {};
  private onModelChange: (files: File[]) => void = () => {};
  private files: File[] = [];
  private destroyed$ = new Subject<void>();
  private allowedTypes = ['.png', '.jpg', '.jpeg'];

  @Output()
  uploaded = new EventEmitter<File[]>();

  isDisabled = false;

  writeValue(files: File[]): void {
    this.files = uniqBy(files, 'name');
  }

  registerOnChange(fn: (files: File[]) => void): void {
    this.onModelChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  async onDroppedFiles(files: NgxFileDropEntry[]): Promise<void> {
    this.onTouch();

    const uploadFiles: File[] = await Promise.all(
      files.reduce<Promise<File>[]>((prev, curr) => {
        if (curr.fileEntry.isFile) {
          const fileEntry = curr.fileEntry as FileSystemFileEntry;
          const promise = new Promise<File>(res => fileEntry.file(file => res(file)));
          return [...prev, promise];
        }
        return prev;
      }, []),
    );

    this.onChange(
      uploadFiles.filter(file => this.allowedTypes.some(type => file.name.endsWith(type))),
    );
  }

  private onChange(files: File[]): void {
    if (files.length) {
      this.files = [...this.files, ...files];
      this.uploaded.emit(this.files);
      this.onModelChange(this.files);
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }
}
