<script setup lang="ts">
// 简洁信息卡：统一「上=时间 / 中=标题 / 下=元信息(插槽)」结构
// 用于资料页的「我的帖子 / 我的评论 / 我的收藏 / 浏览历史」列表项
defineOptions({ name: 'FeedCard' });

interface Props {
  /** 顶部时间文案（发布/收藏/浏览等时间） */
  time?: string;
  /** 中部标题或内容（最多两行，超出省略） */
  title?: string;
}

defineProps<Props>();
</script>

<template>
  <div class="feed-card">
    <!-- 上：时间 -->
    <div class="feed-time">{{ time || '—' }}</div>
    <!-- 中：标题/内容 -->
    <div class="feed-title">{{ title || '—' }}</div>
    <!-- 下：元信息，由调用方通过具名插槽自定义（如浏览/点赞/评论、类型标签等） -->
    <div class="feed-meta">
      <slot name="meta" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.feed-card {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background-color: var(--el-bg-color);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  // 悬停高亮，提示可点性/可读性
  &:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 2px 12px rgb(0 0 0 / 6%);
  }

  .feed-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  // 标题最多两行，超出以省略号截断
  .feed-title {
    display: -webkit-box;
    overflow: hidden;
    margin: 6px 0;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .feed-meta {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px 16px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}
</style>
