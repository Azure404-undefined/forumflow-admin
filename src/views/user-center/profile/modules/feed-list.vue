<script setup lang="ts">
// 列表通用外壳：定高滚动容器 + 触底加载 + 空态/加载中/没有更多 状态
// 与 use-load-more 搭配，被资料页「动态/帖子/评论/收藏/历史」复用
import { onMounted, ref } from 'vue';
import { useInfiniteScroll } from '@vueuse/core';

defineOptions({ name: 'FeedList' });

interface Props {
  /** 是否加载中（由 useLoadMore 透传） */
  loading: boolean;
  /** 是否已全部加载 */
  finished: boolean;
  /** 是否为空（finished 且列表无数据） */
  empty: boolean;
  /** 空态文案 */
  emptyText?: string;
  /** 加载下一页的方法（useLoadMore 的 loadMore） */
  loadMore: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  emptyText: '暂无数据'
});

// 绑定到定高滚动容器；这里用 @vueuse 的 useInfiniteScroll 而非 EP 的 v-infinite-scroll：
// 后者在 EP 2.x 已标记弃用且会刷控制台警告，前者还能借 ResizeObserver 处理懒加载标签页初次可见的情况
const scrollRef = ref<HTMLElement | null>(null);

useInfiniteScroll(scrollRef, () => props.loadMore(), {
  distance: 60,
  // 加载中或已加载完则停止触发，避免重复请求
  canLoadMore: () => !props.loading && !props.finished
});

// 首次进入（懒加载标签页可见时）确保拉取第一页
onMounted(() => props.loadMore());
</script>

<template>
  <!-- 定高滚动容器：内容超出即在容器内滚动，滚到底触发 loadMore -->
  <div ref="scrollRef" class="scroll-list">
    <!-- 空态 -->
    <ElEmpty v-if="empty" :description="emptyText" />
    <!-- 列表内容（由调用方插入 feed-card / 时间线等） -->
    <div v-else class="feed-body">
      <slot />
    </div>

    <!-- 底部状态行：加载中 / 没有更多了 -->
    <div class="list-footer">
      <span v-if="loading">加载中...</span>
      <span v-else-if="finished && !empty">没有更多了</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
// 定高滚动区：高度按视口减去横幅/标签等占位估算，内部独立滚动
.scroll-list {
  overflow-y: auto;
  max-height: calc(100vh - 320px);
  min-height: 240px;
  padding-right: 4px;

  .feed-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .list-footer {
    padding: 16px 0 4px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }
}
</style>
