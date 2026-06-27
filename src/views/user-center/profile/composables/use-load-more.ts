import { ref } from 'vue';
import type { Ref } from 'vue';

/** 单页请求结果：列表数据 + 总条数（用于判断是否已加载完） */
interface PageResult<T> {
  list: T[];
  total: number;
}

/**
 * 通用「下拉触底加载更多」组合式函数
 *
 * 维护分页游标与累加列表，配合 `feed-list.vue` 的 `useInfiniteScroll` 使用：
 * 滚动到底部时调用 `loadMore` 拉取下一页并追加到 `list`，直至 `finished`。
 *
 * @param fetcher 分页请求函数，入参为页码与每页数量；成功返回 { list, total }，出错返回 null
 * @param pageSize 每页数量（默认 10）
 * @returns list 累加后的列表 / loading 是否加载中 / finished 是否已全部加载 / error 是否出错 / loadMore 加载下一页 / reset 重置
 */
export function useLoadMore<T>(
  fetcher: (pageNum: number, pageSize: number) => Promise<PageResult<T> | null>,
  pageSize = 10
) {
  // 累加的列表数据（断言为 Ref<T[]> 以保留泛型类型）
  const list = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const finished = ref(false);
  const error = ref(false);
  // 下一次要请求的页码（闭包内私有，不对外暴露）
  let pageNum = 1;

  /** 加载下一页：正在加载或已全部加载时直接返回，避免重复/越界请求 */
  async function loadMore() {
    if (loading.value || finished.value) return;

    loading.value = true;
    const res = await fetcher(pageNum, pageSize);
    loading.value = false;

    // 请求出错：标记错误并结束，避免无限重试
    if (!res) {
      error.value = true;
      finished.value = true;
      return;
    }

    // 追加本页数据并前移页码
    list.value.push(...res.list);
    pageNum += 1;

    // 本页为空或已累计到总数 → 没有更多
    if (res.list.length === 0 || list.value.length >= res.total) {
      finished.value = true;
    }
  }

  /** 重置到初始状态（如需重新从第一页加载时调用） */
  function reset() {
    list.value = [];
    loading.value = false;
    finished.value = false;
    error.value = false;
    pageNum = 1;
  }

  return { list, loading, finished, error, loadMore, reset };
}
