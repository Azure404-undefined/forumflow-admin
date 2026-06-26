declare namespace Api {
  namespace Profile {
    // 用户个人信息
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

    // 更新基本信息请求体
    interface UpdateProfileBody {
      nickname: string;
      email: string;
      phone: string;
    }

    // 修改密码请求体
    interface UpdatePasswordBody {
      oldPassword: string;
      newPassword: string;
      confirmPassword: string;
    }
  }
}
