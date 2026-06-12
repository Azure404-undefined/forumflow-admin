import { request } from '../request';

// 获取仪表盘数据
export function fetchDashboardData() {
  return request<Api.Dashboard.DashboardData>({
    url: '/dashboard',
    method: 'get'
  });
}
