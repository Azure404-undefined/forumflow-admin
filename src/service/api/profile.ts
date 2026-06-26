import { request } from '../request';

/**
 * 获取当前用户个人信息
 */
export function fetchUserProfile() {
  return request<Api.Profile.UserProfile>({
    url: '/profile',
    method: 'get'
  });
}

/**
 * 更新用户基本信息（昵称、邮箱、手机号）
 */
export function updateProfile(data: Api.Profile.UpdateProfileBody) {
  return request({
    url: '/profile',
    method: 'put',
    data
  });
}

/**
 * 修改密码
 */
export function updatePassword(data: Api.Profile.UpdatePasswordBody) {
  return request({
    url: '/profile/password',
    method: 'put',
    data
  });
}

/**
 * 上传头像
 */
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
