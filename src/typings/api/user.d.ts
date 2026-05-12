// src/typings/api/user.d.ts
declare namespace Api {
  /**
   * backend api module: "user"
   */
  namespace User {
    // 用户信息实体
    interface UserInfo {
      id: string;
      username: string;
      nickname: string;
      email: string;
      phone: string;
      status: 0 | 1; // 0-禁用 1-启用
      roles: string[];
      createTime: string;
    }

    // 获取用户列表请求参数（分页+搜索）
    interface UserListParams {
      pageNum: number;
      pageSize: number;
      username?: string;
      nickname?: string;
      status?: 0 | 1;
      phone?: string;
    }

    // 获取用户列表响应数据
    interface UserListResponse {
      list: UserInfo[];
      total: number;
      pageNum: number;
      pageSize: number;
    }

    // 新增/编辑用户请求体
    interface UserForm {
      username: string;
      nickname: string;
      email: string;
      phone?: string;
      password?: string; // 新增时必填，编辑时可选
      status: 0 | 1;
      roles: string[];
    }

    // 分配角色请求体
    interface AssignRolesBody {
      roleIds: string[];
    }

    // 重置密码请求体
    interface ResetPwdBody {
      newPassword: string;
    }

    // 修改状态请求体
    interface UpdateStatusBody {
      status: 0 | 1;
    }

    // 状态类型
    type status = '0' | '1';
  }
}
