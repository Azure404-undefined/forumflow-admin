declare namespace Api {
  namespace Comment {
    type CommentStatus = 'pending' | 'published' | 'rejected' | 'deleted';

    interface CommentInfo {
      id: string;
      content: string;
      postId: string;
      postTitle?: string; // 独立页面列表需要显示所属帖子
      authorId: string;
      authorName: string;
      authorAvatar?: string;
      parentId?: string; // 回复的评论ID（若为回复）
      replyToName?: string; // 回复的对象昵称
      children?: CommentInfo[]; // 二级评论列表
      collapsed?: boolean; // UI 折叠状态
      childrenCollapsed?: boolean; // 二级评论折叠状态（默认折叠，仅显示前两条）
      status: CommentStatus;
      likeCount: number;
      createTime: string;
      updateTime?: string;
    }

    interface CommentListParams {
      pageNum: number;
      pageSize: number;
      postId?: string; // 可选，若传入则只查某帖子的评论
      status?: CommentStatus;
      authorName?: string;
      startTime?: string;
      endTime?: string;
    }

    interface CommentListResponse {
      list: CommentInfo[];
      total: number;
      pageNum: number;
      pageSize: number;
    }

    interface AuditBody {
      ids: string[];
      status: 'published' | 'rejected';
    }
  }
}
