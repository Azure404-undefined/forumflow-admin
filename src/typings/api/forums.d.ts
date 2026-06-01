declare namespace Api {
  namespace Forum {
    // 版块状态
    type ForumStatus = 0 | 1; // 0-禁用 1-启用

    // 版块信息（树形节点）
    interface ForumInfo {
      id: string;
      name: string;
      description?: string;
      parentId: string | null; // 父级ID，null或空表示顶级
      sort: number; // 排序序号
      status: ForumStatus;
      createTime: string;
      children?: ForumInfo[]; // 子版块（仅树形响应时使用）
      postCount?: number; // 版块下的帖子数量
      createUser?: string; // 创建人用户名
      updateTime?: string; // 更新时间
      updateUser?: string; // 更新人用户名
      svgIcon?: string; // 版块图标（可选）
    }

    // 新增/编辑版块请求体
    interface ForumForm {
      id?: string; // 编辑时存在
      name: string;
      description?: string;
      parentId: string | null;
      sort: number;
      status: ForumStatus;
      svgIcon?: File;
    }

    // 新增/编辑版块响应
    interface ForumResponse {
      id?: string; // 新增时返回
      url: string;
    }

    // 获取版块树形列表响应
    type ForumTreeResponse = ForumInfo[];

    // 移动版块（调整排序或父子关系）请求体
    interface MoveForumBody {
      id: string;
      targetParentId: string | null;
      targetSort: number;
    }
  }
}
