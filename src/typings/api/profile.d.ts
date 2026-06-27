declare namespace Api {
  namespace Profile {
    // ========== 基本信息 ==========
    interface UserProfile {
      id: string;
      username: string;
      nickname: string;
      email: string;
      phone: string;
      avatar: string;
      roles: string[];
      createTime: string;
    }

    // ========== 统计 ==========
    interface UserStats {
      likes: number;
      follows: number;
      comments: number;
    }

    // ========== 动态/帖子/评论列表项 ==========
    interface TimelineItem {
      id: string;
      type: 'post' | 'comment' | 'like' | 'follow'; // 动态类型
      targetId: string;
      title: string;
      content: string;
      createTime: string;
    }

    // ========== 浏览历史 ==========
    interface HistoryItem {
      id: string;
      targetId: string;
      targetType: 'post' | 'comment';
      title: string;
      viewTime: string;
    }

    // ========== 收藏 ==========
    interface FavoriteItem {
      id: string;
      targetId: string;
      targetType: 'post' | 'comment';
      title: string;
      collectTime: string;
    }

    // ========== 操作日志 ==========
    interface LogItem {
      id: string;
      action: string;
      target: string;
      ip: string;
      userAgent: string;
      createTime: string;
    }

    // ========== 登录设备/会话 ==========
    interface SessionItem {
      id: string;
      device: string;
      browser: string;
      ip: string;
      loginTime: string;
      isCurrent: boolean;
    }

    // ========== 隐私设置 ==========
    interface PrivacySettings {
      publicProfile: boolean; // 公开个人资料
      publicFavorites: boolean; // 公开收藏
      publicHistory: boolean; // 公开浏览历史
      allowFollow: boolean; // 允许关注
      allowComment: boolean; // 允许评论
      allowPrivateMessage: boolean; // 允许私信
    }

    // ========== 请求体 ==========
    interface UpdateProfileBody {
      nickname: string;
      email: string;
      phone: string;
    }

    interface UpdatePasswordBody {
      oldPassword: string;
      newPassword: string;
      confirmPassword: string;
    }

    interface UpdatePrivacyBody {
      publicProfile?: boolean;
      publicFavorites?: boolean;
      publicHistory?: boolean;
      allowFollow?: boolean;
      allowComment?: boolean;
      allowPrivateMessage?: boolean;
    }
  }
}
