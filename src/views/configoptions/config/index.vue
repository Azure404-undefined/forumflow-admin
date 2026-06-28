<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { fetchConfigs, saveConfigs } from '@/service/api/config';
import { uploadImage } from '@/service/api/post';
import SvgIcon from '@/components/custom/svg-icon.vue';

type ConfigGroup = Api.Config.ConfigGroup;

const formRef = ref<FormInstance | null>(null);
const loading = ref(false);
const saving = ref(false);
const activeTab = ref('');
const configGroups = ref<ConfigGroup[]>([]);
const formData = reactive<Record<string, any>>({});
const formRules = reactive<FormRules<Record<string, any>>>({});

// 获取配置数据
const getConfigs = async () => {
  loading.value = true;
  try {
    const res = await fetchConfigs();
    configGroups.value = res.data || [];

    // 初始化表单数据、验证规则和激活选项卡
    if (configGroups.value.length > 0) {
      activeTab.value = configGroups.value[0].groupKey;
      configGroups.value.forEach(group => {
        group.items.forEach(item => {
          formData[item.key] = item.value;
          // 为每个配置项设置验证规则
          formRef.value?.clearValidate();
          formRules[item.key] = [{ required: true, message: `${item.label}不能为空`, trigger: 'blur' }];
        });
      });
    }
  } catch {
    ElMessage.error('加载配置失败');
  } finally {
    loading.value = false;
  }
};

// 当前选项卡的配置项
const currentItems = computed(() => {
  const group = configGroups.value.find(g => g.groupKey === activeTab.value);
  return group?.items || [];
});

// 保存配置
const handleSave = async () => {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) {
    ElMessage.error('请填写完整的配置信息');
    return;
  }

  saving.value = true;
  try {
    const data: Api.Config.SaveConfigBody = {};
    configGroups.value.forEach(group => {
      group.items.forEach(item => {
        data[item.key] = formData[item.key];
      });
    });

    const res = await saveConfigs(data);
    ElMessage.success(res.response?.data?.msg || '保存成功');
    await getConfigs();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    saving.value = false;
  }
};

// 重置配置
const handleReset = () => {
  configGroups.value.forEach(group => {
    group.items.forEach(item => {
      formData[item.key] = item.value;
    });
  });
  ElMessage.success('已重置为原始值');
};

// 图片上传处理
const handleCustomUpload = async (key: string, options: any) => {
  const { file, onSuccess, onError } = options;
  try {
    const res = await uploadImage(file);
    formData[key] = res.data?.url || '';
    onSuccess(res);
    ElMessage.success('上传成功');
  } catch (error) {
    onError(error);
    ElMessage.error('上传失败');
  }
};

onMounted(() => {
  getConfigs();
});
</script>

<template>
  <div class="config-options-page">
    <!-- 配置卡片 -->
    <ElCard class="config-card">
      <ElSkeleton v-if="loading" :rows="5" animated />
      <template v-else>
        <!-- 选项卡 -->
        <ElTabs v-model="activeTab" class="config-tabs">
          <ElTabPane
            v-for="group in configGroups"
            :key="group.groupKey"
            :label="group.groupName"
            :name="group.groupKey"
          />
        </ElTabs>

        <!-- 配置表单 -->
        <ElForm ref="formRef" :model="formData" :rules="formRules" class="config-form" label-position="top">
          <!-- 两列网格 -->
          <div class="config-flex">
            <template v-for="item in currentItems" :key="item.key">
              <ElFormItem :label="item.label" :prop="item.key">
                <!-- String 类型 -->
                <template v-if="item.type === 'string'">
                  <ElInput v-model="formData[item.key]" :placeholder="item.placeholder" clearable />
                </template>

                <!-- Number 类型 -->
                <template v-else-if="item.type === 'number'">
                  <ElInputNumber v-model="formData[item.key]" class="full-width" />
                </template>

                <!-- Boolean 类型 -->
                <template v-else-if="item.type === 'boolean'">
                  <ElSwitch v-model="formData[item.key]" :active-value="true" :inactive-value="false" />
                </template>

                <!-- Image 类型 -->
                <template v-else-if="item.type === 'image'">
                  <div class="config-upload">
                    <div v-if="formData[item.key]" class="config-image-preview">
                      <img :src="formData[item.key]" alt="preview" class="config-image-preview__img" />
                    </div>
                    <ElUpload
                      :http-request="options => handleCustomUpload(item.key, options)"
                      class="config-upload-button"
                      :auto-upload="true"
                      :show-file-list="false"
                    >
                      <template #default>
                        <div class="config-upload-icon">
                          <SvgIcon icon="lets-icons:add-round" color="#6d51ff" :font-size="50"></SvgIcon>
                        </div>
                      </template>
                    </ElUpload>
                  </div>
                </template>

                <!-- JSON 类型 -->
                <template v-else-if="item.type === 'json'">
                  <ElInput v-model="formData[item.key]" type="textarea" :rows="4" :placeholder="item.placeholder" />
                </template>

                <!-- 帮助文本 -->
                <template v-if="item.helpText">
                  <p class="config-help-text">{{ item.helpText }}</p>
                </template>
              </ElFormItem>
            </template>
          </div>

          <!-- 空状态 -->
          <div v-if="currentItems.length === 0" class="config-empty-state">当前选项卡无配置项</div>

          <!-- 底部按钮 -->
          <div class="config-actions">
            <ElButton :loading="loading" @click="handleReset">重置</ElButton>
            <ElButton type="primary" :loading="saving" @click="handleSave">保存配置</ElButton>
          </div>
        </ElForm>
      </template>
    </ElCard>
  </div>
</template>

<style scoped lang="scss">
.config-options-page {
  display: flex;
  flex-direction: column;
  padding: 16px;
  min-height: 100%;
}

.config-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.config-tabs {
  margin-bottom: 24px;
}

:deep(.el-tabs__nav) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.el-tabs__item.is-active) {
  color: #6d51ff;
}

.config-form {
  flex: 1;
}

.config-flex {
  display: flex;
  flex-wrap: wrap;

  :deep(.el-form-item) {
    margin: 8px;
    margin-left: 24px;
    width: 500px;
  }
}

.config-upload {
  display: flex;
  gap: 16px;
}

.config-image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #e4e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.config-upload-button {
  position: relative;
  margin-right: 16px;
  width: 100px;
  height: 100px;
  border: 1px solid #e4e7eb;
  border-radius: 4px;
  .config-upload-icon {
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -25%;
    margin-top: -25%;
  }
}

.config-image-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.config-help-text {
  display: block;
  font-size: 14px;
  color: #909399;
}

.config-empty-state {
  text-align: center;
  padding: 32px 0;
  color: #909399;
}

.config-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e4e7eb;
}

:deep(.el-card) {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  border: 1px solid #f0f0f0;

  .el-card__body {
    padding: 24px;
    display: flex;
    flex-direction: column;
  }
}

:deep(.el-form) {
  .el-form-item {
    margin-bottom: 24px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .el-input-number {
    width: 100%;
  }
}
// 满宽（替代原内联 width:100%）
.full-width {
  width: 100%;
}
</style>
