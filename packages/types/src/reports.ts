export enum ReportReason {
  SPAM = 'SPAM',
  RULES_VIOLATION = 'RULES_VIOLATION',
  HARASSMENT = 'HARASSMENT',
  AI_GENERATED = 'AI_GENERATED',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}

export interface Report {
  id: string;
  reason: ReportReason;
  status: ReportStatus;
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
