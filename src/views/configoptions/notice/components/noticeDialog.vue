<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { addNotice, editNotice, fetchNoticeDetail } from '@/service/api/notice';
import RichTextEditor from '@/components/common/richTextEditor.vue';
import SafeContent from '@/components/common/safeContend.vue';

const props = defineProps<{
  modelValue: boolean;
  noticeId?: string;
  mode?: 'create' | 'edit' | 'view';
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'updated'): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

const isCreateMode = computed(() => props.mode === 'create');
const isViewMode = computed(() => props.mode === 'view');
const dialogTitle = computed(() => {
  if (isCreateMode.value) return '新增公告';
  return isViewMode.value ? '公告详情' : '编辑公告';
});
const loading = ref(false);
const submitting = ref(false);

const form = ref<Api.Notice.NoticeForm>({
  title: '',
  content: '',
  status: 'draft'
});

async function loadDetail() {
  if (!props.noticeId || isCreateMode.value) return;
  loading.value = true;
  try {
    const res = await fetchNoticeDetail(props.noticeId);
    if (res.data) {
      form.value = {
        id: res.data.id,
        title: res.data.title,
        content: res.data.content,
        status: res.data.status,
        publishTime: res.data.publishTime
      };
    }
  } catch {
    ElMessage.error('获取公告详情失败');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = {
    title: '',
    content: '',
    status: 'draft'
  };
}

watch([() => props.modelValue, () => props.noticeId, () => props.mode], ([valVisible, valNoticeId, valMode]) => {
  if (valVisible) {
    if (valMode === 'create') {
      resetForm();
    } else if (valNoticeId) {
      loadDetail();
    }
  }
});

function close() {
  visible.value = false;
}

async function handleSubmit() {
  // 基础验证
  if (!form.value.title.trim()) {
    ElMessage.warning('请输入公告标题');
    return;
  }
  if (!form.value.content.trim()) {
    ElMessage.warning('请输入公告内容');
    return;
  }

  submitting.value = true;
  try {
    if (isCreateMode.value) {
      await addNotice(form.value);
      ElMessage.success('新增成功');
    } else if (form.value.id) {
      await editNotice(form.value.id, form.value);
      ElMessage.success('编辑成功');
    }
    close();
    emit('updated');
  } catch {
    ElMessage.error(isCreateMode.value ? '新增失败' : '编辑失败');
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog v-model="visible" :title="dialogTitle" width="min(700px, 94vw)" top="6vh" :destroy-on-close="true">
    <div v-loading="loading">
      <ElDescriptions v-if="isViewMode" :column="1" border class="notice-detail">
        <ElDescriptionsItem label="公告标题">{{ form.title }}</ElDescriptionsItem>
        <ElDescriptionsItem label="公告状态">
          <ElTag :type="form.status === 'published' ? 'success' : form.status === 'archived' ? 'info' : 'warning'">
            {{ form.status === 'published' ? '已发布' : form.status === 'archived' ? '已下架' : '草稿' }}
          </ElTag>
        </ElDescriptionsItem>
        <ElDescriptionsItem v-if="form.publishTime" label="发布时间">{{ form.publishTime }}</ElDescriptionsItem>
        <ElDescriptionsItem label="公告内容">
          <SafeContent :html="form.content || ''" :allow-iframe="true" />
        </ElDescriptionsItem>
      </ElDescriptions>
      <ElForm v-else label-position="top" class="dialog-form">
        <ElFormItem label="公告标题" required>
          <ElInput v-model="form.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
        </ElFormItem>

        <ElFormItem label="公告内容" required>
          <div class="dialog-editor">
            <RichTextEditor v-model:model-value="form.content" :toolbar-keys="['emotion', 'uploadImage']" />
          </div>
        </ElFormItem>

        <ElFormItem label="公告状态">
          <ElSelect v-model="form.status">
            <ElOption label="草稿" value="draft" />
            <ElOption label="已发布" value="published" />
            <ElOption label="已下架" value="archived" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem v-if="form.status === 'published'" label="发布时间">
          <ElDatePicker
            v-model="form.publishTime"
            type="datetime"
            placeholder="选择发布时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </ElFormItem>
      </ElForm>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton v-if="!isViewMode" type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
        <ElButton @click="close">{{ isViewMode ? '关闭' : '取消' }}</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.dialog-form {
  padding: 12px 0;
  .dialog-editor {
    width: 100%;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.notice-detail {
  margin: 12px 0;
}
</style>
