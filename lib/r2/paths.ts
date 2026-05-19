export function profilePhotoPath(studentId: string, ext: string): string {
  return `profiles/${studentId}/photo.${ext}`;
}

export function documentPath(
  applicationRef: string,
  documentType: string,
  uuid: string,
  ext: string,
): string {
  return `documents/${applicationRef}/${documentType}/${uuid}.${ext}`;
}

export function invoicePdfPath(invoiceRef: string): string {
  return `invoices/${invoiceRef}/invoice.pdf`;
}

export function certificatePath(studentId: string, courseSlug: string): string {
  return `certificates/${studentId}/${courseSlug}/certificate.pdf`;
}

export function courseThumbnailPath(slug: string, ext: string): string {
  return `courses/${slug}/thumbnail.${ext}`;
}

export function teamPhotoPath(memberSlug: string, ext: string): string {
  return `team/${memberSlug}/photo.${ext}`;
}
