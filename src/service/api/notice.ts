import { request } from '../request';

export function fetchNoticeList(params: Api.Notice.NoticeListParams) {
  return request<Api.Notice.NoticeListResponse>({
    url: '/notices',
    method: 'get',
    params
  });
}

export function fetchNoticeDetail(id: string) {
  return request<Api.Notice.NoticeInfo>({
    url: `/notices/${id}`,
    method: 'get'
  });
}

export function addNotice(data: Api.Notice.NoticeForm) {
  return request({
    url: '/notices',
    method: 'post',
    data
  });
}

export function editNotice(id: string, data: Api.Notice.NoticeForm) {
  return request({
    url: `/notices/${id}`,
    method: 'put',
    data
  });
}

export function deleteNotice(id: string) {
  return request({
    url: `/notices/${id}`,
    method: 'delete'
  });
}

export function batchDeleteNotice(data: Api.Notice.BatchDeleteBody) {
  return request({
    url: '/notices',
    method: 'delete',
    data
  });
}

export function publishNotice(id: string) {
  return request({
    url: `/notices/${id}/publish`,
    method: 'post'
  });
}

export function setNoticeTop(id: string, top: Api.Notice.TopStatus) {
  return request({
    url: `/notices/${id}/top`,
    method: 'post',
    data: { top }
  });
}
