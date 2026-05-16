declare namespace Api {
  namespace Role {
    // 角色实体
    interface RoleInfo {
      id: string; // 角色标识，如 'admin'
      name: string; // 角色名称，如 '管理员'
      description?: string;
      status: 0 | 1; // 0-禁用 1-启用
      createTime: string;
    }

    // 角色列表请求参数
    interface RoleListParams {
      pageNum?: number;
      pageSize?: number;
      id?: string;
      name?: string;
      status?: 0 | 1;
    }

    // 角色列表响应（通常不分页，直接返回数组）
    type RoleList = RoleInfo[];

    // 新增/编辑角色请求体
    interface RoleForm {
      id: string;
      name: string;
      description?: string;
      status: 0 | 1;
    }

    // 权限树节点（用于分配权限）
    interface PermissionNode {
      id: string; // 权限标识，如 'user:view'
      label: string; // 显示名称，如 '查看用户'
      children?: PermissionNode[];
    }

    // 角色已分配的权限ID列表
    type RolePermissions = string[];
  }
}
