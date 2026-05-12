import { request } from '../request';

/**
 * 获取用户列表
 * @param params 查询参数（分页、搜索）
 */
export function fetchUserList(params: Api.User.UserListParams) {
  return request<Api.User.UserListResponse>({
    url: '/users',
    method: 'get',
    params
  });
}

/**
 * 获取用户详情（编辑回显）
 * @param id 用户ID
 */
export function fetchUserDetail(id: string) {
  return request<Api.User.UserInfo>({
    url: `/users/${id}`,
    method: 'get'
  });
}

/**
 * 新增用户
 * @param data 用户表单数据
 */
export function addUser(data: Api.User.UserForm) {
  return request({
    url: '/users',
    method: 'post',
    data
  });
}

/**
 * 编辑用户
 * @param id 用户ID
 * @param data 用户表单数据
 */
export function editUser(id: string, data: Api.User.UserForm) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除用户
 * @param id 用户ID
 */
export function deleteUser(id: string) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  });
}

/**
 * 重置用户密码
 * @param id 用户ID
 * @param data 新密码
 */
export function resetUserPwd(id: string, data: Api.User.ResetPwdBody) {
  return request({
    url: `/users/${id}/resetPwd`,
    method: 'put',
    data
  });
}

/**
 * 修改用户状态
 * @param id 用户ID
 * @param data 状态(0禁用/1启用)
 */
export function updateUserStatus(id: string, data: Api.User.UpdateStatusBody) {
  return request({
    url: `/users/${id}/status`,
    method: 'put',
    data
  });
}

/**
 * 为用户分配角色
 * @param id 用户ID
 * @param data 角色ID数组
 */
export function assignUserRoles(id: string, data: Api.User.AssignRolesBody) {
  return request({
    url: `/users/${id}/roles`,
    method: 'put',
    data
  });
}
