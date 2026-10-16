export enum ReportReason {
  SPAM = 'SPAM',
  RULES_VIOLATION = 'RULES_VIOLATION',
  HARASSMENT = 'HARASSMENT',
  AI_GENERATED = 'AI_GENERATED',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

// Mirrors the backend's `ModerationAction`; only a resolved report carries one.
export enum ModerationAction {
  WARNING = 'WARNING',
  TEMPORARY_BAN = 'TEMPORARY_BAN',
  PERMANENT_BAN = 'PERMANENT_BAN',
}

export interface Report {
  id: string;
  reason: ReportReason;
  status: ReportStatus;
  action: ModerationAction | null;
  userId: string;
  blogId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetAllReportsWithFilters {
  reports: (Report & {
    user: {
      id: string;
      name: string;
      image: string | null;
    };
    blog: {
      id: string;
      title: string;
      slug: string;
      author: {
        id: string;
        name: string;
        image: string | null;
      };
    };
  })[];
  totalPages: number;
}

export interface CreateReport {
  report: Report;
}
