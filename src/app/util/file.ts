import { environment } from 'src/environments/environment';

export function getImgSrc(imageId?: string) {
  if (imageId) {
    return `${environment.fileServiceUrl}/v1/files/${imageId}?disposition=image/*`;
  }
  return null;
}

export function getThumbnailSrc(imageId?: string) {
  if (imageId) {
    return `${environment.fileServiceUrl}/v1/thumbnail/${imageId}?w=70&h=50`;
  }
  return null;
}
