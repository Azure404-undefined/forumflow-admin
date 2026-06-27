import { request } from '../request';

// ===== 基本信息 =====
export function fetchUserProfile() {
  return request<Api.Profile.UserProfile>({ url: '/profile', method: 'get' });
}

export function updateProfile(data: Api.Profile.UpdateProfileBody) {
  return request({ url: '/profile', method: 'put', data });
}

export function updatePassword(data: Api.Profile.UpdatePasswordBody) {
  return request({ url: '/profile/password', method: 'put', data });
}

export function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return request<{ url: string }>({
    url: '/profile/avatar',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

// ===== 统计 =====
export function fetchUserStats() {
  return request<Api.Profile.UserStats>({ url: '/profile/stats', method: 'get' });
}

// ===== 动态（聚合列表） =====
export function fetchTimeline(params: { pageNum: number; pageSize: number }) {
  return request<{ list: Api.Profile.TimelineItem[]; total: number }>({
    url: '/profile/timeline',
    method: 'get',
    params
  });
}

// ===== 用户帖子列表（复用已有接口） =====
// 可以直接用 fetchPostList 传入 authorName
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

// ===== 用户评论列表（复用已有接口） =====
// 可以直接用 fetchCommentList 传入 authorName
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

// ===== 浏览历史 =====
export function fetchHistory(params: { pageNum: number; pageSize: number }) {
  return request<{ list: Api.Profile.HistoryItem[]; total: number }>({
    url: '/profile/history',
    method: 'get',
    params
  });
}

// ===== 收藏 =====
export function fetchFavorites(params: { pageNum: number; pageSize: number }) {
  return request<{ list: Api.Profile.FavoriteItem[]; total: number }>({
    url: '/profile/favorites',
    method: 'get',
    params
  });
}

// ===== 操作日志 =====
export function fetchUserLogs(params: { pageNum: number; pageSize: number }) {
  return request<{ list: Api.Profile.LogItem[]; total: number }>({
    url: '/profile/logs',
    method: 'get',
    params
  });
}

// ===== 会话/设备列表 =====
export function fetchSessions() {
  return request<Api.Profile.SessionItem[]>({ url: '/profile/sessions', method: 'get' });
}

// ===== 隐私设置 =====
export function fetchPrivacy() {
  return request<Api.Profile.PrivacySettings>({ url: '/profile/privacy', method: 'get' });
}

export function updatePrivacy(data: Api.Profile.UpdatePrivacyBody) {
  return request({ url: '/profile/privacy', method: 'put', data });
}
