import { request } from '../request';

/**
 * 获取系统配置（分组结构）
 */
export function fetchConfigs() {
  return request<Api.Config.ConfigResponse>({
    url: '/system/configs',
    method: 'get'
  });
}

/**
 * 保存系统配置
 * @param data 配置键值对
 */
export function saveConfigs(data: Api.Config.SaveConfigBody) {
  return request({
    url: '/system/configs',
    method: 'put',
    data
  });
}
