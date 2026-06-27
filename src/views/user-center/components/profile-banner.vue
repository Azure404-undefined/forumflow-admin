<script setup lang="ts">
// 个人中心共享横幅：封面图 + 头像 + 用户信息 + 统计 + 操作按钮
// 资料页与设置页共用，通过 props 控制差异（是否显示统计、按钮形态、移动端是否精简）
import { computed } from 'vue';
import { ArrowLeft, Clock, Edit, Message, Phone } from '@element-plus/icons-vue';
import { useRouterPush } from '@/hooks/common/router';

defineOptions({ name: 'ProfileBanner' });

interface Props {
  userInfo: Api.Profile.UserProfile | null;
  stats?: Api.Profile.UserStats | null;
  /** 是否显示统计行（获赞/关注/评论） */
  showStats?: boolean;
  /** 右侧操作按钮：edit=编辑资料(跳设置) / back=返回(跳资料页) / none=不显示 */
  action?: 'edit' | 'back' | 'none';
  /** 移动端是否精简（隐藏统计与按钮，仅留头像+信息） */
  compactMobile?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  stats: null,
  showStats: true,
  action: 'edit',
  compactMobile: false
});

// 横幅封面图：如需替换为自定义封面，改这里即可（当前为网络风景占位图）
const coverBg = 'https://picsum.photos/id/1018/1200/300';

const { routerPushByKey } = useRouterPush();

// 按 action 计算右侧按钮的文案/图标/跳转；none 时返回 null 不渲染
const actionConfig = computed(() => {
  if (props.action === 'back') {
    return { text: '返回个人中心', icon: ArrowLeft, handler: () => routerPushByKey('user-center_profile') };
  }
  if (props.action === 'edit') {
    return { text: '编辑资料', icon: Edit, handler: () => routerPushByKey('user-center_settings') };
  }
  return null;
});
</script>

<template>
  <!-- compact-mobile 类用于移动端精简（隐藏右侧统计/按钮） -->
  <div class="profile-header" :class="{ 'compact-mobile': compactMobile }">
    <!-- 封面背景图 + 主色渐变蒙层 -->
    <div class="cover" :style="{ backgroundImage: `url(${coverBg})` }">
      <div class="cover-mask"></div>
    </div>

    <div class="header-row">
      <!-- 头像：仅 25% 探入封面，其余露在封面线以下 -->
      <div class="avatar-wrapper">
        <ElAvatar :size="112" :src="userInfo?.avatar" class="profile-avatar">
          {{ userInfo?.nickname?.charAt(0) || 'U' }}
        </ElAvatar>
      </div>

      <!-- 用户信息（头像右侧；移动端非精简模式下换行到下方） -->
      <div class="header-info">
        <div class="name-block">
          <h2 class="nickname">{{ userInfo?.nickname || '—' }}</h2>
          <span class="username">@{{ userInfo?.username || '—' }}</span>
          <ElTag v-for="role in userInfo?.roles" :key="role" size="small" type="primary">{{ role }}</ElTag>
        </div>
        <div class="meta-row">
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

      <!-- 右侧：统计 + 操作按钮（与头像下半段平行） -->
      <div v-if="showStats || actionConfig" class="header-right">
        <div v-if="showStats" class="stats-row">
          <div class="stat-item">
            <CountTo :start-value="0" :end-value="stats?.likes ?? 0" class="stat-value" />
            <span class="stat-label">获赞</span>
          </div>
          <ElDivider direction="vertical" class="stat-divider" />
          <div class="stat-item">
            <CountTo :start-value="0" :end-value="stats?.follows ?? 0" class="stat-value" />
            <span class="stat-label">关注</span>
          </div>
          <ElDivider direction="vertical" class="stat-divider" />
          <div class="stat-item">
            <CountTo :start-value="0" :end-value="stats?.comments ?? 0" class="stat-value" />
            <span class="stat-label">评论</span>
          </div>
        </div>
        <ElButton v-if="actionConfig" type="primary" class="edit-btn" @click="actionConfig?.handler()">
          <ElIcon><component :is="actionConfig.icon" /></ElIcon>
          {{ actionConfig.text }}
        </ElButton>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.profile-header {
  .cover {
    position: relative;
    height: 120px;
    background-position: center;
    background-size: cover;

    .cover-mask {
      position: absolute;
      inset: 0;
      background: linear-gradient(120deg, var(--el-color-primary) 0%, transparent 100%);
      opacity: 0.55;
    }
  }

  .header-row {
    // 提升到封面之上：.cover 是定位元素，否则会盖住（遮挡）静态的头像
    position: relative;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px 16px;
    padding: 0 24px 16px;

    .avatar-wrapper {
      order: 1;
      flex-shrink: 0;
      // 头像仅 25% 遮住封面（112 × 25% = 28px 探入封面，其余 75% 在封面线以下）
      margin-top: -28px;

      .profile-avatar {
        border: 4px solid var(--el-bg-color);
        box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
      }
    }

    .header-info {
      order: 2;
      flex: 1 1 0;
      min-width: 0;
      padding-top: 8px;

      .name-block {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 6px 10px;

        .nickname {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .username {
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }
      }

      .meta-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px 20px;
        margin-top: 10px;
        font-size: 14px;
        color: var(--el-text-color-secondary);

        .el-icon {
          margin-right: 4px;
          vertical-align: middle;
        }
      }
    }

    .header-right {
      order: 3;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 10px;
      padding-top: 8px;

      .stats-row {
        display: flex;
        align-items: center;
        gap: 14px;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 50px;

          .stat-value {
            font-size: 19px;
            font-weight: 600;
            line-height: 1.2;
            color: var(--el-text-color-primary);
          }

          .stat-label {
            margin-top: 2px;
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }

        .stat-divider {
          height: 28px;
        }
      }
    }
  }
}

/* ===== 移动端适配：默认（资料页）为「左头像 / 右统计+按钮 一行，用户信息换行到下方」 ===== */
@media (max-width: 768px) {
  .profile-header {
    .cover {
      height: 96px;
    }

    .header-row {
      padding: 0 16px 14px;

      .avatar-wrapper {
        // 头像略放大并下移，使其仅 25% 遮住封面（96 × 25% = 24px 探入封面）
        margin-top: -24px;

        .profile-avatar {
          width: 96px !important;
          height: 96px !important;
          line-height: 96px !important;
        }
      }

      // 移动端顺序：头像(1) → 统计/按钮(2) 同一行；用户信息(3) 整行换到下方
      .header-right {
        order: 2;
        gap: 8px;

        // 收紧统计，保证与头像同行不挤换行
        .stats-row {
          gap: 10px;

          .stat-item {
            min-width: 40px;

            .stat-value {
              font-size: 17px;
            }
          }

          .stat-divider {
            height: 24px;
          }
        }

        .edit-btn {
          padding: 6px 12px;
        }
      }

      .header-info {
        order: 3;
        flex: 0 0 100%;

        .meta-row {
          flex-direction: column;
          gap: 6px;
        }
      }
    }

    // 精简模式（设置页移动端）：隐藏右侧统计/按钮，仅头像 + 用户信息且同行
    &.compact-mobile {
      .header-right {
        display: none;
      }

      .header-info {
        order: 2;
        flex: 1 1 0;

        .meta-row {
          flex-direction: column;
          gap: 6px;
        }
      }
    }
  }
}
</style>
