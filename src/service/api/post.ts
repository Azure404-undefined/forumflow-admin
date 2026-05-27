// src/service/api/post.ts
import { request } from '../request';

/**
 * 获取帖子列表
 * @param params 查询参数（分页、筛选）
 */
export function fetchPostList(params: Api.Post.PostListParams) {
  return request<Api.Post.PostListResponse>({
    url: '/posts',
    method: 'get',
    params
  });
}

/**
 * 获取帖子详情
 * @param id 帖子ID
 */
export function fetchPostDetail(id: string) {
  return request<Api.Post.PostInfo>({
    url: `/posts/${id}`,
    method: 'get'
  });
}

/**
 * 新增帖子
 * @param data 帖子表单数据
 */
export function addPost(data: Api.Post.PostForm) {
  return request({
    url: '/posts',
    method: 'post',
    data
  });
}

/**
 * 编辑帖子
 * @param id 帖子ID
 * @param data 帖子表单数据
 */
export function editPost(id: string, data: Api.Post.PostForm) {
  return request({
    url: `/posts/${id}`,
    method: 'put',
    data
  });
}

/**
 * 删除帖子
 * @param id 帖子ID
 */
export function deletePost(id: string) {
  return request({
    url: `/posts/${id}`,
    method: 'delete'
  });
}

/**
 * 批量删除帖子
 * @param data 包含 ids 数组
 */
export function batchDeletePosts(data: Api.Post.BatchOperateBody) {
  return request({
    url: '/posts/batch/delete',
    method: 'post',
    data
  });
}

/**
 * 审核帖子（批量）
 * @param data 包含 ids 数组和 status
 */
export function auditPosts(data: Api.Post.BatchOperateBody) {
  return request({
    url: '/posts/batch/audit',
    method: 'post',
    data
  });
}

/**
 * 置顶/取消置顶帖子
 * @param id 帖子ID
 * @param top 0-取消置顶 1-置顶
 */
export function setPostTop(id: string, top: Api.Post.TopStatus) {
  return request({
    url: `/posts/${id}/top`,
    method: 'put',
    data: { top }
  });
}

/**
 * 加精/取消加精帖子
 * @param id 帖子ID
 * @param essence 0-取消加精 1-加精
 */
export function setPostEssence(id: string, essence: Api.Post.EssenceStatus) {
  return request({
    url: `/posts/${id}/essence`,
    method: 'put',
    data: { essence }
  });
}

/**
 * 上传图片
 * @param file 图片文件
 */
export function uploadImage(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<Api.Post.ImageUploadResponse>({
    url: '/uploadimage',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

/**
 * 上传视频
 * @param file 视频文件
 */
export function uploadVideo(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return request<Api.Post.VideoUploadResponse>({
    url: '/uploadvideo',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
