import { request } from '../request';

/** 获取角色列表 */
export function fetchRoleList(params: Api.Role.RoleListParams) {
  return request<Api.Role.RoleList>({ url: '/roles', method: 'get', params });
}

/** 新增角色 */
export function addRole(data: Api.Role.RoleForm) {
  return request({ url: '/roles', method: 'post', data });
}

/** 编辑角色 */
export function editRole(id: string, data: Api.Role.RoleForm) {
  return request({ url: `/roles/${id}`, method: 'put', data });
}

/** 删除角色 */
export function deleteRole(id: string) {
  return request({ url: `/roles/${id}`, method: 'delete' });
}

/** 获取角色详情（用于编辑回显） */
export function fetchRoleDetail(id: string) {
  return request<Api.Role.RoleInfo>({ url: `/roles/${id}`, method: 'get' });
}

/** 获取权限树（所有可分配的权限） */
export function fetchPermissionTree() {
  return request<Api.Role.PermissionNode[]>({ url: '/permissions/tree', method: 'get' });
}

/** 获取角色已分配的权限ID列表 */
export function fetchRolePermissions(id: string) {
  return request<Api.Role.RolePermissions>({ url: `/roles/${id}/permissions`, method: 'get' });
}

/** 为角色分配权限 */
export function assignRolePermissions(id: string, permissionIds: string[]) {
  return request({ url: `/roles/${id}/permissions`, method: 'put', data: { permissionIds } });
}
