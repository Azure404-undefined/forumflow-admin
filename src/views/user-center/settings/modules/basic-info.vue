<script setup lang="ts">
// 设置页·「基本信息」：头像上传 + 昵称/邮箱/手机 编辑表单
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { fetchUserProfile, updateProfile, uploadAvatar } from '@/service/api/profile';

defineOptions({ name: 'BasicInfo' });

const formRef = ref<FormInstance | null>(null);
const saving = ref(false);

// 表单数据
const formData = reactive({
  avatar: '',
  nickname: '',
  email: '',
  phone: ''
});

// 校验规则：昵称必填；邮箱格式；手机号为大陆 11 位号码
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

// 拉取资料并回填表单
async function loadProfile() {
  const { data, error } = await fetchUserProfile();
  if (error) {
    ElMessage.error('获取个人信息失败');
    return;
  }
  formData.avatar = data?.avatar || '';
  formData.nickname = data?.nickname || '';
  formData.email = data?.email || '';
  formData.phone = data?.phone || '';
}

// 上传头像：走 ElUpload 自定义 http-request，成功后回填头像地址
async function handleUploadAvatar(options: any) {
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
}

// 重置：恢复为接口最新值并清除校验态
function resetForm() {
  loadProfile();
  formRef.value?.clearValidate();
}

// 校验通过后保存基本信息
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  const { error } = await updateProfile({
    nickname: formData.nickname,
    email: formData.email,
    phone: formData.phone
  });
  saving.value = false;

  if (error) {
    ElMessage.error('保存失败');
    return;
  }
  ElMessage.success('保存成功');
}

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="80px" class="basic-info-form">
    <!-- 头像：预览 + 更换 -->
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

    <ElFormItem label="昵称" prop="nickname">
      <ElInput v-model="formData.nickname" placeholder="请输入昵称" maxlength="20" show-word-limit />
    </ElFormItem>

    <ElFormItem label="邮箱" prop="email">
      <ElInput v-model="formData.email" placeholder="请输入邮箱" />
    </ElFormItem>

    <ElFormItem label="手机号" prop="phone">
      <ElInput v-model="formData.phone" placeholder="请输入手机号" />
    </ElFormItem>

    <!-- 操作：保存 / 重置 -->
    <ElFormItem>
      <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
      <ElButton @click="resetForm">重置</ElButton>
    </ElFormItem>
  </ElForm>
</template>

<style scoped lang="scss">
.basic-info-form {
  max-width: 520px;
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

// 移动端：标签变窄并左对齐，头像区允许换行
@media (max-width: 768px) {
  .basic-info-form {
    :deep(.el-form-item__label) {
      width: 80px !important;
      justify-content: flex-start;
      font-size: 13px;
    }
  }

  .avatar-upload {
    flex-wrap: wrap;
  }
}
</style>
