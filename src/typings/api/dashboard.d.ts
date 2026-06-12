// src/typings/api/dashboard.d.ts
declare namespace Api {
  namespace Dashboard {
    // ========== 1. 核心统计卡片 ==========
    interface CoreStatistics {
      totalUsers: number; // 总用户数
      dau: number; // 日活跃用户（今日）
      mau: number; // 月活跃用户（近30天）
      totalPosts: number; // 总帖数
      totalComments: number; // 总评论数
      newPostsToday: number; // 今日新增帖
      newCommentsToday: number; // 今日新增评
      pendingReports: number; // 待处理举报
    }

    // ========== 2. 用户画像 ==========
    interface GenderDistribution {
      male: number; // 男性用户数
      female: number; // 女性用户数
      unknown: number; // 未知
    }

    interface AgeDistribution {
      under18: number; // 18岁以下
      age18_24: number;
      age25_30: number;
      age31_40: number;
      above40: number;
    }

    interface DeviceDistribution {
      pc: number;
      mobile: number;
      tablet: number;
    }

    // ========== 3. 用户活跃度（近30天趋势） ==========
    interface ActiveTrend {
      dates: string[]; // 日期数组 ['06-01', '06-02', ...]
      dau: number[]; // 日活
      mau: number[]; // 月活（滚动30天）
      newUsers: number[]; // 每日新增
    }

    // ========== 4. 热门板块（按帖子数） ==========
    interface HotForum {
      forumId: string;
      forumName: string;
      postCount: number;
      growthRate: number; // 环比增长率（%）
    }

    // ========== 5. 热门帖子（按浏览/评论/点赞综合） ==========
    interface HotPost {
      id: string;
      title: string;
      authorName: string;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      hotScore: number; // 热度分（可后端计算）
      createTime: string;
    }

    // ========== 6. 发帖时段分布（24小时） ==========
    interface PostHourlyDistribution {
      hour: number[]; // 0-23
      count: number[]; // 对应小时的发帖量
    }

    // ========== 7. 汇总所有数据 ==========
    interface DashboardData {
      core: CoreStatistics;
      gender: GenderDistribution;
      age: AgeDistribution;
      device: DeviceDistribution;
      activeTrend: ActiveTrend;
      hotForums: HotForum[];
      hotPosts: HotPost[];
      hourlyPosts: PostHourlyDistribution;
    }
  }
}
