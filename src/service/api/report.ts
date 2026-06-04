import { request } from '../request';

export function fetchReportList(params: Api.Report.ReportListParams) {
  return request<Api.Report.ReportListResponse>({
    url: '/reports',
    method: 'get',
    params
  });
}

export function handleReport(data: Api.Report.HandleReportBody) {
  return request({
    url: '/reports/handle',
    method: 'post',
    data
  });
}

/**
 * 获取举报详情（可选，用于弹窗展示更多信息）
 */
export function fetchReportDetail(id: string) {
  return request<Api.Report.AggregatedReport>({
    url: `/reports/${id}`,
    method: 'get'
  });
}
