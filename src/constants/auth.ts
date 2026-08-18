import type { RouteKey } from '@elegant-router/types';

export const APP_ROLES = {
  super: 'R_SUPER',
  admin: 'R_ADMIN',
  common: 'R_USER_COMMON'
} as const;

export type AppRole = (typeof APP_ROLES)[keyof typeof APP_ROLES];

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  [APP_ROLES.super]: '超级管理员',
  [APP_ROLES.admin]: '管理员',
  [APP_ROLES.common]: '普通用户'
};

export const PERMISSION_CODES = {
  user: {
    create: 'user:create',
    update: 'user:update',
    delete: 'user:delete',
    resetPassword: 'user:reset-password',
    assignRole: 'user:assign-role',
    updateStatus: 'user:update-status'
  },
  role: {
    create: 'role:create',
    update: 'role:update',
    delete: 'role:delete',
    assignPermission: 'role:assign-permission',
    updateStatus: 'role:update-status'
  },
  post: {
    create: 'post:create',
    update: 'post:update',
    delete: 'post:delete',
    audit: 'post:audit',
    top: 'post:top',
    essence: 'post:essence'
  },
  forum: {
    create: 'forum:create',
    update: 'forum:update',
    delete: 'forum:delete',
    move: 'forum:move'
  },
  comment: {
    update: 'comment:update',
    delete: 'comment:delete',
    audit: 'comment:audit'
  },
  report: {
    handle: 'report:handle'
  },
  notice: {
    create: 'notice:create',
    update: 'notice:update',
    delete: 'notice:delete',
    publish: 'notice:publish',
    top: 'notice:top'
  },
  config: {
    update: 'config:update'
  }
} as const;

type ValueOf<T> = T extends unknown ? T[keyof T] : never;

export type PermissionCode = ValueOf<ValueOf<typeof PERMISSION_CODES>>;

export const ALL_PERMISSION_CODES = Object.values(PERMISSION_CODES).flatMap(group =>
  Object.values(group)
) as PermissionCode[];

export const ADMIN_PERMISSION_CODES: PermissionCode[] = [
  ...Object.values(PERMISSION_CODES.user),
  ...Object.values(PERMISSION_CODES.post),
  ...Object.values(PERMISSION_CODES.forum),
  ...Object.values(PERMISSION_CODES.comment),
  ...Object.values(PERMISSION_CODES.report),
  ...Object.values(PERMISSION_CODES.notice)
];

export const ROLE_PERMISSION_CODES: Record<AppRole, PermissionCode[]> = {
  [APP_ROLES.super]: ALL_PERMISSION_CODES,
  [APP_ROLES.admin]: ADMIN_PERMISSION_CODES,
  [APP_ROLES.common]: []
};

const ALL_ROLES: AppRole[] = [APP_ROLES.super, APP_ROLES.admin, APP_ROLES.common];
const MANAGEMENT_ROLES: AppRole[] = [APP_ROLES.super, APP_ROLES.admin];

export const ROUTE_ROLE_MAP: Partial<Record<RouteKey, AppRole[]>> = {
  about: ALL_ROLES,
  home: ALL_ROLES,
  post: ALL_ROLES,
  'post_post-list': ALL_ROLES,
  'post_post-forums': ALL_ROLES,
  'post_post-comment': MANAGEMENT_ROLES,
  report: MANAGEMENT_ROLES,
  user: MANAGEMENT_ROLES,
  role: [APP_ROLES.super],
  configoptions: ALL_ROLES,
  configoptions_notice: ALL_ROLES,
  configoptions_config: [APP_ROLES.super],
  'user-center': ALL_ROLES,
  'user-center_profile': ALL_ROLES,
  'user-center_settings': ALL_ROLES
};

export function isAppRole(role: string): role is AppRole {
  return Object.values(APP_ROLES).includes(role as AppRole);
}
