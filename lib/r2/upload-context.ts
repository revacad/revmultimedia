import { randomUUID } from "crypto";
import {
  certificatePath,
  courseContentPath,
  courseThumbnailPathByUuid,
  documentPath,
  profilePhotoPath,
  resourcePath,
  studentDocumentPath,
  teamPhotoPath,
} from "@/lib/r2/paths";

export type UploadContext =
  | { type: "profile_photo"; studentId: string; ext: string }
  | {
      type: "document";
      applicationRef: string;
      documentType: string;
      ext: string;
    }
  | {
      type: "student_document";
      studentId: string;
      documentType: string;
      ext: string;
    }
  | {
      type: "certificate";
      studentId: string;
      courseSlug: string;
      ext: string;
    }
  | {
      type: "application_document";
      draftId: string;
      documentType: string;
      ext: string;
    }
  | { type: "course_thumbnail"; ext: string }
  | { type: "course_content"; courseId: string; ext: string }
  | { type: "resource"; adminId: string; ext: string }
  | { type: "team_photo"; memberSlug: string; ext: string };

function applicationDraftPath(
  draftId: string,
  documentType: string,
  uuid: string,
  ext: string,
): string {
  return `documents/drafts/${draftId}/${documentType}/${uuid}.${ext}`;
}

export function buildR2KeyFromUploadContext(context: UploadContext): {
  key: string;
  bucket: "private" | "public";
} {
  switch (context.type) {
    case "profile_photo":
      return {
        key: profilePhotoPath(context.studentId, context.ext),
        bucket: "private",
      };
    case "document":
      return {
        key: documentPath(
          context.applicationRef,
          context.documentType,
          randomUUID(),
          context.ext,
        ),
        bucket: "private",
      };
    case "student_document":
      return {
        key: studentDocumentPath(
          context.studentId,
          context.documentType,
          randomUUID(),
          context.ext,
        ),
        bucket: "private",
      };
    case "certificate":
      return {
        key: certificatePath(context.studentId, context.courseSlug),
        bucket: "private",
      };
    case "application_document":
      return {
        key: applicationDraftPath(
          context.draftId,
          context.documentType,
          randomUUID(),
          context.ext,
        ),
        bucket: "private",
      };
    case "course_thumbnail":
      return {
        key: courseThumbnailPath(context.slug, context.ext),
        bucket: "public",
      };
    case "course_content":
      return {
        key: courseContentPath(context.courseId, randomUUID(), context.ext),
        bucket: "public",
      };
    case "resource":
      return {
        key: resourcePath(context.adminId, randomUUID(), context.ext),
        bucket: "private",
      };
    case "team_photo":
      return {
        key: teamPhotoPath(context.memberSlug, context.ext),
        bucket: "public",
      };
    default: {
      const _exhaustive: never = context;
      throw new Error(`Unsupported upload context: ${String(_exhaustive)}`);
    }
  }
}

export function extensionFromFileName(fileName: string): string {
  const parts = fileName.split(".");
  if (parts.length < 2) {
    return "bin";
  }
  return parts[parts.length - 1]!.toLowerCase();
}
