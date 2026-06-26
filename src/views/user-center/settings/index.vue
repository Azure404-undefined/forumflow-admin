<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { ArrowLeft } from '@element-plus/icons-vue';
import { fetchUserProfile, updatePassword, updateProfile, uploadAvatar } from '@/service/api/profile';
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();
const formRef = ref<FormInstance | null>(null);
const saving = ref(false);

// 基础信息表单
const formData = reactive({
  avatar: '',
  nickname: '',
  email: '',
  phone: ''
});

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 表单校验规则
const formRules: FormRules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
};

// 加载个人信息
const loadProfile = async () => {
  const { data, error } = await fetchUserProfile();
  if (error) {
    ElMessage.error('获取个人信息失败');
    return;
  }
  formData.avatar = data?.avatar || '';
  formData.nickname = data?.nickname || '';
  formData.email = data?.email || '';
  formData.phone = data?.phone || '';
};

// 返回个人中心
const goBack = () => {
  routerPushByKey('user-center_profile');
};

// 上传头像
const handleUploadAvatar = async (options: any) => {
  const { file, onSuccess, onError } = options;
  const { data, error } = await uploadAvatar(file);
  if (error) {
    ElMessage.error('头像上传失败');
    onError();
    return;
  }
  formData.avatar = data?.url || '';
  ElMessage.success('头像上传成功');
  onSuccess(data);
};

// 重置表单（恢复为初始值）
const resetForm = () => {
  loadProfile();
  passwordForm.oldPassword = '';
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  formRef.value?.clearValidate();
};

// 保存设置
const handleSave = async () => {
  // 校验基础信息
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  // 如果填写了密码，则校验密码字段
  if (passwordForm.newPassword || passwordForm.oldPassword) {
    if (!passwordForm.oldPassword) {
      ElMessage.warning('请输入当前密码');
      return;
    }
    if (!passwordForm.newPassword) {
      ElMessage.warning('请输入新密码');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      ElMessage.warning('两次输入的密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      ElMessage.warning('新密码长度不能少于6位');
      return;
    }
  }

  saving.value = true;

  // 更新基本信息
  const { error: updateError } = await updateProfile({
    nickname: formData.nickname,
    email: formData.email,
    phone: formData.phone
  });

  if (updateError) {
    ElMessage.error('保存失败');
    saving.value = false;
    return;
  }

  // 如果有修改密码，更新密码
  if (passwordForm.oldPassword && passwordForm.newPassword) {
    const { error: passwordError } = await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword
    });

    if (passwordError) {
      ElMessage.error('密码修改失败');
      saving.value = false;
      return;
    }
  }

  saving.value = false;
  ElMessage.success('保存成功');
  // 跳转回个人中心
  routerPushByKey('user-center_profile');
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="settings-page">
    <ElCard class="settings-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <ElButton link @click="goBack">
            <ElIcon><ArrowLeft /></ElIcon>
            返回
          </ElButton>
          <span class="title">个人设置</span>
          <span></span>
        </div>
      </template>

      <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="100px" class="settings-form">
        <!-- ===== 头像 ===== -->
        <ElFormItem label="头像">
          <div class="avatar-upload">
            <ElAvatar :size="80" :src="formData.avatar" class="upload-avatar">
              {{ formData.nickname?.charAt(0) || 'U' }}
            </ElAvatar>
            <ElUpload :http-request="handleUploadAvatar" :show-file-list="false" :auto-upload="true">
              <ElButton size="small" type="primary">更换头像</ElButton>
            </ElUpload>
          </div>
        </ElFormItem>

        <!-- ===== 昵称 ===== -->
        <ElFormItem label="昵称" prop="nickname">
          <ElInput v-model="formData.nickname" placeholder="请输入昵称" maxlength="20" show-word-limit />
        </ElFormItem>

        <!-- ===== 邮箱 ===== -->
        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="formData.email" placeholder="请输入邮箱" />
        </ElFormItem>

        <!-- ===== 手机 ===== -->
        <ElFormItem label="手机号" prop="phone">
          <ElInput v-model="formData.phone" placeholder="请输入手机号" />
        </ElFormItem>

        <!-- ===== 修改密码 ===== -->
        <ElDivider>修改密码</ElDivider>

        <ElFormItem label="当前密码" prop="oldPassword">
          <ElInput v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
        </ElFormItem>

        <ElFormItem label="新密码" prop="newPassword">
          <ElInput v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </ElFormItem>

        <ElFormItem label="确认密码" prop="confirmPassword">
          <ElInput
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </ElFormItem>

        <!-- ===== 提交按钮 ===== -->
        <ElFormItem>
          <ElButton type="primary" :loading="saving" @click="handleSave">保存设置</ElButton>
          <ElButton @click="resetForm">重置</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<style scoped lang="scss">
.settings-page {
  display: flex;
  justify-content: center;
  padding: 24px;
  min-height: 80vh;
}

.settings-card {
  max-width: 700px;
  width: 100%;
  border-radius: 12px;

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.settings-form {
  padding: 8px 0;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;

  .upload-avatar {
    border: 2px solid var(--el-border-color-light);
  }
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .settings-page {
    padding: 12px;
  }

  .settings-form {
    :deep(.el-form-item) {
      .el-form-item__label {
        width: 80px !important;
        font-size: 13px;
      }
    }
  }

  .avatar-upload {
    flex-wrap: wrap;
  }
}
</style>
