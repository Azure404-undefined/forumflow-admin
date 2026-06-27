<script setup lang="ts">
// 设置页·「修改密码」：当前密码 + 新密码 + 确认密码 的独立表单
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormItemRule, FormRules } from 'element-plus';
import { updatePassword } from '@/service/api/profile';

defineOptions({ name: 'ChangePassword' });

const formRef = ref<FormInstance | null>(null);
const saving = ref(false);

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 自定义校验：确认密码需与新密码一致
const validateConfirm: FormItemRule['validator'] = (_rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

// 校验规则：当前密码必填；新密码 ≥6 位；确认密码必填且一致
const formRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不能少于 6 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
};

// 校验通过后提交修改密码，成功后清空表单
async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  saving.value = true;
  const { error } = await updatePassword({
    oldPassword: passwordForm.oldPassword,
    newPassword: passwordForm.newPassword,
    confirmPassword: passwordForm.confirmPassword
  });
  saving.value = false;

  if (error) {
    ElMessage.error('密码修改失败');
    return;
  }
  ElMessage.success('密码修改成功');
  formRef.value?.resetFields();
}
</script>

<template>
  <ElForm ref="formRef" :model="passwordForm" :rules="formRules" label-width="80px" class="password-form">
    <ElFormItem label="当前密码" prop="oldPassword">
      <ElInput v-model="passwordForm.oldPassword" type="password" placeholder="请输入当前密码" show-password />
    </ElFormItem>

    <ElFormItem label="新密码" prop="newPassword">
      <ElInput v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
    </ElFormItem>

    <ElFormItem label="确认密码" prop="confirmPassword">
      <ElInput v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
    </ElFormItem>

    <ElFormItem>
      <ElButton type="primary" :loading="saving" @click="handleSave">修改密码</ElButton>
    </ElFormItem>
  </ElForm>
</template>

<style scoped lang="scss">
.password-form {
  max-width: 520px;
  padding: 8px 0;
}

// 移动端：标签变窄并左对齐
@media (max-width: 768px) {
  .password-form {
    :deep(.el-form-item__label) {
      width: 80px !important;
      justify-content: flex-start;
      font-size: 13px;
    }
  }
}
</style>
