import { request } from '../request';

/**
 * 获取版块树形列表（用于管理页面）
 */
export function fetchForumTree() {
  return request<Api.Forum.ForumTreeResponse>({
    url: '/forums/tree',
    method: 'get'
  });
}

/**
 * 获取版块下拉选项（平铺列表，仅包含启用的版块，用于其他模块的选择器）
 */
export function fetchForumOptions() {
  return request<Array<{ id: string; name: string }>>({
    url: '/forums/options',
    method: 'get'
  });
}

/**
 * 新增版块
 */
export function addForum(data: FormData) {
  return request<Api.Forum.ForumResponse>({
    url: '/forums',
    method: 'post',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/**
 * 编辑版块
 */
export function editForum(id: string, data: FormData) {
  return request<Api.Forum.ForumResponse>({
    url: `/forums/${id}`,
    method: 'put',
    data,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

/**
 * 删除版块（会同时删除子版块）
 */
export function deleteForum(id: string) {
  return request({
    url: `/forums/${id}`,
    method: 'delete'
  });
}

/**
 * 移动版块（改变父子关系或排序）
 */
export function moveForum(data: Api.Forum.MoveForumBody) {
  return request({
    url: '/forums/move',
    method: 'post',
    data
  });
}
