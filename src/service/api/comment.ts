import { request } from '../request';

/**
 * 获取评论列表
 */
export function fetchCommentList(params: Api.Comment.CommentListParams) {
  return request<Api.Comment.CommentListResponse>({
    url: '/comments',
    method: 'get',
    params
  });
}

/**
 * 删除评论
 */
export function deleteComment(id: string) {
  return request({
    url: `/comments/${id}`,
    method: 'delete'
  });
}

/**
 * 批量删除评论
 */
export function batchDeleteComments(ids: string[]) {
  return request({
    url: '/comments/batch/delete',
    method: 'post',
    data: { ids }
  });
}

/**
 * 审核评论（批量）
 */
export function auditComments(data: Api.Comment.AuditBody) {
  return request({
    url: '/comments/batch/audit',
    method: 'post',
    data
  });
}

/**
 * 编辑评论（管理员修改内容）
 */
export function editComment(id: string, content: string) {
  return request({
    url: `/comments/${id}`,
    method: 'put',
    data: { content }
  });
}

/**
 * 获取评论详情
 */
export function fetchCommentDetail(id: string) {
  return request<Api.Comment.CommentInfo>({
    url: `/comments/${id}`,
    method: 'get'
  });
}
