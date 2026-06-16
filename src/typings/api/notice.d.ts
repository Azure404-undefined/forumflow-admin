declare namespace Api {
  namespace Notice {
    // 公告状态
    type NoticeStatus = 'draft' | 'published' | 'archived';

    // 置顶状态
    type TopStatus = 0 | 1;

    // 公告信息
    interface NoticeInfo {
      id: string;
      title: string;
      content: string; // 富文本内容
      status: NoticeStatus;
      top: TopStatus; // 置顶状态
      publishTime?: string; // 发布时间（状态为 published 时有效）
      createTime: string;
      updateTime?: string;
      creatorId: string;
      creatorName: string;
    }

    // 获取公告列表请求参数
    interface NoticeListParams {
      pageNum: number;
      pageSize: number;
      title?: string;
      status?: NoticeStatus;
      top?: TopStatus;
      startTime?: string;
      endTime?: string;
    }

    // 获取公告列表响应
    interface NoticeListResponse {
      list: NoticeInfo[];
      total: number;
      pageNum: number;
      pageSize: number;
    }

    // 新增/编辑公告请求体
    interface NoticeForm {
      id?: string;
      title: string;
      content: string;
      status: NoticeStatus;
      top?: TopStatus;
      publishTime?: string;
    }

    // 批量删除请求体
    interface BatchDeleteBody {
      ids: string[];
    }
  }
}
