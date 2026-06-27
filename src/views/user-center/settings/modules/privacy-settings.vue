<script setup lang="ts">
// 设置页·「隐私设置」：一组开关，保存时整体提交
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchPrivacy, updatePrivacy } from '@/service/api/profile';

defineOptions({ name: 'PrivacySettings' });

type PrivacyKey = keyof Api.Profile.PrivacySettings;

// 开关项配置（key 对应接口字段，label/desc 为展示文案）
const options: { key: PrivacyKey; label: string; desc: string }[] = [
  { key: 'publicProfile', label: '公开个人资料', desc: '允许其他用户查看你的个人资料' },
  { key: 'publicFavorites', label: '公开收藏', desc: '允许其他用户查看你的收藏列表' },
  { key: 'publicHistory', label: '公开浏览历史', desc: '允许其他用户查看你的浏览历史' },
  { key: 'allowFollow', label: '允许关注', desc: '允许其他用户关注你' },
  { key: 'allowComment', label: '允许评论', desc: '允许其他用户评论你的内容' },
  { key: 'allowPrivateMessage', label: '允许私信', desc: '允许其他用户向你发送私信' }
];

const loading = ref(false);
const saving = ref(false);

// 隐私开关的双向绑定数据（初始全 false，加载后用接口值覆盖）
const form = reactive<Api.Profile.PrivacySettings>({
  publicProfile: false,
  publicFavorites: false,
  publicHistory: false,
  allowFollow: false,
  allowComment: false,
  allowPrivateMessage: false
});

// 拉取当前隐私设置并回填表单
async function loadData() {
  loading.value = true;
  const { data, error } = await fetchPrivacy();
  if (error) {
    ElMessage.error('获取隐私设置失败');
  } else if (data) {
    Object.assign(form, data);
  }
  loading.value = false;
}

// 整体保存隐私设置
async function handleSave() {
  saving.value = true;
  const { error } = await updatePrivacy({ ...form });
  saving.value = false;

  if (error) {
    ElMessage.error('保存失败');
    return;
  }
  ElMessage.success('保存成功');
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div v-loading="loading" class="privacy-settings">
    <!-- 逐项渲染：左侧标题+说明，右侧开关 -->
    <div v-for="item in options" :key="item.key" class="privacy-item">
      <div class="privacy-text">
        <span class="privacy-label">{{ item.label }}</span>
        <span class="privacy-desc">{{ item.desc }}</span>
      </div>
      <ElSwitch v-model="form[item.key]" />
    </div>

    <!-- 保存按钮：整体提交 -->
    <div class="privacy-actions">
      <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.privacy-settings {
  max-width: 560px;

  .privacy-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 4px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .privacy-text {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .privacy-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--el-text-color-primary);
      }

      .privacy-desc {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }

  .privacy-actions {
    margin-top: 20px;
  }
}
</style>
