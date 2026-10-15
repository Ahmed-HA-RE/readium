export const APP_NAME = 'Readium';

// Shared by the admin tables' "rows per page" select and the admin list DTOs that validate it.
export const ADMIN_TABLE_PAGE_SIZES = [5, 15, 20, 25] as const;

export const DEFAULT_ADMIN_TABLE_PAGE_SIZE = ADMIN_TABLE_PAGE_SIZES[0];
