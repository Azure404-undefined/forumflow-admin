declare namespace Api {
  namespace Report {
    type ReportTargetType = 'post' | 'comment';
    type ReportStatus = 'pending' | 'approved' | 'rejected';
    type ReportReason = 'spam' | 'harassment' | 'offensive' | 'misinformation' | 'illegal' | 'other';

    // 举报明细（单条举报记录）
    interface ReportDetail {
      id: string;
      reporterId: string;
      reporterName: string;
      reason: ReportReason;
      reasonDesc?: string;
      createTime: string;
    }

    // 聚合后的举报项（按 targetId）
    interface AggregatedReport {
      targetId: string;
      targetType: ReportTargetType;
      targetTitle: string;
      reportCount: number;
      latestReason: ReportReason;
      status: ReportStatus; // 只要有一条明细未处理，整体为 pending
      handlerId?: string;
      handlerName?: string;
      handleTime?: string;
      children: ReportDetail[]; // 明细列表（前端展开显示）
    }

    // 获取举报列表请求参数（不变）
    interface ReportListParams {
      pageNum: number;
      pageSize: number;
      status?: ReportStatus;
      targetType?: ReportTargetType;
      reporterName?: string; // 注意：聚合后按内容搜索，可能不再支持按举报人搜索，可改为按内容标题搜索
      startTime?: string;
      endTime?: string;
    }

    // 获取举报列表响应（data 为 AggregatedReport[]）
    interface ReportListResponse {
      list: AggregatedReport[];
      total: number;
      pageNum: number;
      pageSize: number;
    }

    // 处理举报请求体（按 targetId 处理）
    interface HandleReportBody {
      targetIds: string[]; // 聚合项的 targetId 数组
      action: 'approve' | 'reject';
      remark?: string;
    }
  }
}
