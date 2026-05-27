// src/typings/api/post.d.ts
declare namespace Api {
  /**
   * backend api module: "post"
   */
  namespace Post {
    // 帖子状态枚举
    type PostStatus = 'draft' | 'published' | 'pending' | 'rejected' | 'deleted';
    // 置顶状态: 0-未置顶 1-已置顶
    type TopStatus = 0 | 1;
    // 加精状态: 0-未加精 1-已加精
    type EssenceStatus = 0 | 1;

    // 帖子信息实体
    interface PostInfo {
      id: string;
      title: string;
      content: string; // 富文本或纯文本
      images: string[];
      authorId: string;
      authorName: string;
      authorAvatar: string;
      forumId: string;
      forumName: string;
      status: PostStatus;
      top: TopStatus;
      essence: EssenceStatus;
      viewCount: number;
      likeCount: number;
      commentCount: number;
      createTime: string;
      updateTime: string;
    }

    // 获取帖子列表请求参数
    interface PostListParams {
      pageNum: number;
      pageSize: number;
      title?: string;
      authorName?: string;
      forumId?: string;
      status?: PostStatus;
      top?: TopStatus;
      essence?: EssenceStatus;
      startTime?: string;
      endTime?: string;
    }

    // 获取帖子列表响应
    interface PostListResponse {
      list: PostInfo[];
      total: number;
      pageNum: number;
      pageSize: number;
    }

    // 新增/编辑帖子请求体
    interface PostForm {
      id?: string;
      title: string;
      content: string;
      forumId: string;
      status: PostStatus;
      top: TopStatus;
      essence: EssenceStatus;
    }

    // 批量操作请求体
    interface BatchOperateBody {
      ids: string[];
      status?: PostStatus; // 批量审核时使用
    }

    // 图片上传响应
    interface ImageUploadResponse {
      url: string;
      alt?: string;
      href?: string;
    }

    // 视频上传响应
    interface VideoUploadResponse {
      url: string;
      poster?: string; // 视频封面图URL
    }
  }
}

declare module '@wangeditor/editor-for-vue' {
  import type { Component } from 'vue';
  export const Editor: Component;
  export const Toolbar: Component;
}
