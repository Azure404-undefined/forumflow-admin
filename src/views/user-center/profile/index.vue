<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock, Edit, Message, Phone } from '@element-plus/icons-vue';
import { fetchUserProfile } from '@/service/api/profile';
import { useRouterPush } from '@/hooks/common/router';

const { routerPushByKey } = useRouterPush();
const loading = ref(false);
const userInfo = ref<Api.Profile.UserProfile | null>(null);

const goToSettings = () => {
  routerPushByKey('user-center_settings');
};

const loadProfile = async () => {
  loading.value = true;
  const { data, error } = await fetchUserProfile();
  if (error) {
    ElMessage.error('获取个人信息失败');
  } else {
    userInfo.value = data;
  }
  loading.value = false;
};

onMounted(() => {
  loadProfile();
});
</script>

<template>
  <div class="profile-page">
    <ElCard v-loading="loading" class="profile-card" shadow="hover">
      <div class="profile-header">
        <!-- 头像 -->
        <div class="avatar-wrapper">
          <ElAvatar :size="100" :src="userInfo?.avatar" class="profile-avatar">
            {{ userInfo?.nickname?.charAt(0) || 'U' }}
          </ElAvatar>
        </div>

        <!-- 基本信息 -->
        <div class="profile-info">
          <div class="info-row">
            <h2 class="nickname">{{ userInfo?.nickname || '—' }}</h2>
            <span class="username">@{{ userInfo?.username }}</span>
          </div>
          <div class="info-row">
            <ElTag v-for="role in userInfo?.roles" :key="role" size="small" type="primary" class="role-tag">
              {{ role }}
            </ElTag>
          </div>
          <div class="info-row meta">
            <span>
              <ElIcon><Message /></ElIcon>
              {{ userInfo?.email || '未设置' }}
            </span>
            <span>
              <ElIcon><Phone /></ElIcon>
              {{ userInfo?.phone || '未设置' }}
            </span>
            <span>
              <ElIcon><Clock /></ElIcon>
              加入于 {{ userInfo?.createTime || '—' }}
            </span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="profile-actions">
          <ElButton type="primary" @click="goToSettings">
            <ElIcon><Edit /></ElIcon>
            编辑资料
          </ElButton>
        </div>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 24px;
  min-height: 80vh;
}

.profile-card {
  max-width: 800px;
  width: 100%;
  border-radius: 12px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 8px 0;

  .avatar-wrapper {
    flex-shrink: 0;
  }

  .profile-avatar {
    border: 3px solid var(--el-color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .profile-info {
    flex: 1;
    min-width: 0;

    .info-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px 16px;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .nickname {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .username {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

    .role-tag {
      margin-right: 4px;
    }

    .meta {
      color: var(--el-text-color-secondary);
      font-size: 14px;
      gap: 16px;

      .el-icon {
        margin-right: 4px;
        vertical-align: middle;
      }
    }
  }

  .profile-actions {
    flex-shrink: 0;
  }
}

/* ===== 移动端适配 ===== */
@media (max-width: 768px) {
  .profile-page {
    padding: 12px;
  }

  .profile-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;

    .profile-info {
      .info-row {
        justify-content: center;
      }

      .meta {
        flex-direction: column;
        gap: 4px;
      }
    }

    .profile-actions {
      width: 100%;
      .el-button {
        width: 100%;
      }
    }
  }
}
</style>
