<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import * as echarts from 'echarts';
import { fetchDashboardData } from '@/service/api/dashboard.js';
import StatisticCard from './components/StatisticCard.vue';

// 初始化数据
const dashboardData = reactive<Api.Dashboard.DashboardData>({
  core: {
    totalUsers: 0,
    dau: 0,
    mau: 0,
    totalPosts: 0,
    totalComments: 0,
    newPostsToday: 0,
    newCommentsToday: 0,
    pendingReports: 0
  },
  gender: {
    male: 0,
    female: 0,
    unknown: 0
  },
  age: {
    under18: 0,
    age18_24: 0,
    age25_30: 0,
    age31_40: 0,
    above40: 0
  },
  device: {
    pc: 0,
    mobile: 0,
    tablet: 0
  },
  activeTrend: {
    dates: [],
    dau: [],
    mau: [],
    newUsers: []
  },
  hotForums: [],
  hotPosts: [],
  hourlyPosts: {
    hour: [],
    count: []
  }
});

// 图表引用
const activeTrendChartRef: Ref<HTMLElement | null> = ref(null);
const genderChartRef: Ref<HTMLElement | null> = ref(null);
const ageChartRef: Ref<HTMLElement | null> = ref(null);
const deviceChartRef: Ref<HTMLElement | null> = ref(null);
const hourlyPostsChartRef: Ref<HTMLElement | null> = ref(null);

// 保存所有图表实例以便统一 resize / dispose
const chartInstances = ref<echarts.EChartsType[]>([]);

const toFixedResponse = (number: number) => {
  return `${number.toFixed(2)}%`;
};

const growthRate = (number: number) => {
  return number > 0;
};

// 统一的 resize 函数
const resizeCharts = () => {
  if (!chartInstances.value || !chartInstances.value.length) return;
  chartInstances.value.forEach(c => {
    c.resize();
  });
};

// 初始化用户活跃趋势图表（折线图）
const initActiveTrendChart = () => {
  if (!activeTrendChartRef.value) return;
  const chart = echarts.init(activeTrendChartRef.value);
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['日活', '月活', '新增用户']
    },
    xAxis: {
      type: 'category',
      data: dashboardData.activeTrend.dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '日活',
        data: dashboardData.activeTrend.dau,
        type: 'line',
        smooth: true
      },
      {
        name: '月活',
        data: dashboardData.activeTrend.mau,
        type: 'line',
        smooth: true
      },
      {
        name: '新增用户',
        data: dashboardData.activeTrend.newUsers,
        type: 'line',
        smooth: true
      }
    ]
  };
  chart.setOption(option);
  chartInstances.value.push(chart);
};

// 初始化性别分布饼图
const initGenderChart = () => {
  if (!genderChartRef.value) return;
  const chart = echarts.init(genderChartRef.value);
  const data = [
    { value: dashboardData.gender.male, name: '男性' },
    { value: dashboardData.gender.female, name: '女性' },
    { value: dashboardData.gender.unknown, name: '未知' }
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      data: data.map(item => item.name),
      formatter: (name: string) => {
        const item = data.find(it => it.name === name);
        if (!item || total === 0) return name;
        return `${name} ${((item.value / total) * 100).toFixed(1)}%`;
      }
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        center: ['50%', '30%'],
        data
      }
    ]
  };
  chart.setOption(option);
  chartInstances.value.push(chart);
};

// 初始化年龄分布饼图
const initAgeChart = () => {
  if (!ageChartRef.value) return;
  const chart = echarts.init(ageChartRef.value);
  const data = [
    { value: dashboardData.age.under18, name: '18岁以下' },
    { value: dashboardData.age.age18_24, name: '18-24岁' },
    { value: dashboardData.age.age25_30, name: '25-30岁' },
    { value: dashboardData.age.age31_40, name: '31-40岁' },
    { value: dashboardData.age.above40, name: '40岁以上' }
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      // left: 'left',
      data: data.map(item => item.name),
      formatter: (name: string) => {
        const item = data.find(it => it.name === name);
        if (!item || total === 0) return name;
        return `${name} ${((item.value / total) * 100).toFixed(1)}%`;
      }
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        center: ['50%', '30%'],
        data
      }
    ]
  };
  chart.setOption(option);
  chartInstances.value.push(chart);
};

// 初始化设备分布饼图
const initDeviceChart = () => {
  if (!deviceChartRef.value) return;
  const chart = echarts.init(deviceChartRef.value);
  const data = [
    { value: dashboardData.device.pc, name: 'PC' },
    { value: dashboardData.device.mobile, name: '移动设备' },
    { value: dashboardData.device.tablet, name: '平板' }
  ];
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      data: data.map(item => item.name),
      formatter: (name: string) => {
        const item = data.find(it => it.name === name);
        if (!item || total === 0) return name;
        return `${name} ${((item.value / total) * 100).toFixed(1)}%`;
      }
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        center: ['50%', '30%'],
        data
      }
    ]
  };
  chart.setOption(option);
  chartInstances.value.push(chart);
};

// 初始化发帖时段分布柱状图
const initHourlyPostsChart = () => {
  if (!hourlyPostsChartRef.value) return;
  const chart = echarts.init(hourlyPostsChartRef.value);
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      data: ['发帖数']
    },
    xAxis: {
      type: 'category',
      data: dashboardData.hourlyPosts.hour.map(h => `${h}:00`)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '发帖数',
        data: dashboardData.hourlyPosts.count,
        type: 'bar'
      }
    ]
  };
  chart.setOption(option);
  chartInstances.value.push(chart);
};

// 初始化所有图表
const initCharts = () => {
  initActiveTrendChart();
  initGenderChart();
  initAgeChart();
  initDeviceChart();
  initHourlyPostsChart();
};

onMounted(async () => {
  const { data } = await fetchDashboardData();
  Object.assign(dashboardData, data);

  // 热门帖子按综合热度排序（降序）
  if (dashboardData.hotPosts && dashboardData.hotPosts.length) {
    dashboardData.hotPosts.sort((a, b) => (b.hotScore || 0) - (a.hotScore || 0));
  }

  // 热门板块按帖子数排序（降序）
  if (dashboardData.hotForums && dashboardData.hotForums.length) {
    dashboardData.hotForums.sort((a, b) => b.postCount - a.postCount);
  }

  initCharts();
  // 在所有图表初始化完成后，统一监听窗口变化进行 resize
  window.addEventListener('resize', resizeCharts);
});

onUnmounted(() => {
  // 移除全局 resize 监听
  window.removeEventListener('resize', resizeCharts);
  // 销毁图表实例，释放资源
  if (chartInstances.value && chartInstances.value.length) {
    chartInstances.value.forEach(c => {
      c.dispose();
    });
    chartInstances.value = [];
  }
});
</script>

<template>
  <div class="dashboard-container p-16px">
    <ElSpace direction="vertical" :size="16" fill style="width: 100%">
      <!-- ========== 第一行：核心统计卡片 ========== -->
      <ElRow :gutter="16">
        <ElCol :xs="24" :sm="12" :md="6" :lg="3">
          <StatisticCard
            title="总用户数"
            :value="dashboardData.core.totalUsers"
            icon="rivet-icons:user-group-solid"
            color="#00bcff"
          />
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6" :lg="3">
          <StatisticCard title="日活跃用户" :value="dashboardData.core.dau" icon="lets-icons:line-up" color="#82ff00" />
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6" :lg="3">
          <StatisticCard title="月活跃用户" :value="dashboardData.core.mau" icon="stash:user-clock" color="#ff9700" />
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6" :lg="3">
          <StatisticCard title="总帖数" :value="dashboardData.core.totalPosts" icon="iconoir:post" color="#ffec62" />
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6" :lg="3">
          <StatisticCard
            title="总评论数"
            :value="dashboardData.core.totalComments"
            icon="mingcute:comment-line"
            color="#e462ff"
          />
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6" :lg="3">
          <StatisticCard
            title="今日新增帖"
            :value="dashboardData.core.newPostsToday"
            icon="streamline-ultimate:pen-write"
            color="skyblue"
          />
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6" :lg="3">
          <StatisticCard
            title="今日新增评"
            :value="dashboardData.core.newCommentsToday"
            icon="mdi:comment-text-outline"
            color="#50e149"
          />
        </ElCol>
        <ElCol :xs="24" :sm="12" :md="6" :lg="3">
          <StatisticCard
            title="待处理举报"
            :value="dashboardData.core.pendingReports"
            icon="ic:round-report"
            color="orange"
          />
        </ElCol>
      </ElRow>

      <!-- ========== 第二行：用户活跃趋势 + 用户画像 ========== -->
      <ElRow :gutter="16">
        <!-- 用户活跃趋势 (lg: 9, md: 24, xs: 24) -->
        <ElCol :xs="24" :sm="24" :md="24" :lg="9" class="mb-16px">
          <ElCard class="chart-card">
            <template #header>
              <div class="flex-between">
                <span class="font-semibold">用户活跃趋势</span>
              </div>
            </template>
            <div ref="activeTrendChartRef" class="chart-container" />
          </ElCard>
        </ElCol>

        <!-- 用户画像 (lg: 5/5/5, md: 24, xs: 24) -->
        <!-- 性别分布饼图 -->
        <ElCol :xs="24" :sm="8" :md="8" :lg="5" class="mb-16px">
          <ElCard class="chart-card">
            <template #header>
              <div class="flex-center">
                <span class="text-sm font-semibold">性别分布</span>
              </div>
            </template>
            <div ref="genderChartRef" class="chart-container" />
          </ElCard>
        </ElCol>

        <!-- 年龄分布饼图 -->
        <ElCol :xs="24" :sm="8" :md="8" :lg="5" class="mb-16px">
          <ElCard class="chart-card">
            <template #header>
              <div class="flex-center">
                <span class="text-sm font-semibold">年龄分布</span>
              </div>
            </template>
            <div ref="ageChartRef" class="chart-container" />
          </ElCard>
        </ElCol>

        <!-- 设备分布饼图 -->
        <ElCol :xs="24" :sm="8" :md="8" :lg="5" class="mb-16px">
          <ElCard class="chart-card">
            <template #header>
              <div class="flex-center">
                <span class="text-sm font-semibold">设备分布</span>
              </div>
            </template>
            <div ref="deviceChartRef" class="chart-container" />
          </ElCard>
        </ElCol>
      </ElRow>

      <!-- ========== 第三行：热门帖子 + 热门板块 + 发帖时段分布 ========== -->
      <ElRow :gutter="16">
        <!-- 热门帖子 (lg: 9, md: 24, xs: 24) -->
        <ElCol :xs="24" :sm="24" :md="24" :lg="9" class="mb-16px">
          <ElCard class="chart-card">
            <template #header>
              <div class="flex-between">
                <span class="font-semibold">热门帖子（综合热度）</span>
              </div>
            </template>
            <ElTable :data="dashboardData.hotPosts" stripe style="width: 100%">
              <!--
 <el-table-column label="排名" width="50">
                <template #default = "{ row }">
                  <div>{{ dashboardData.hotPosts.length }}</div>
                </template>
              </el-table-column> 
-->
              <ElTableColumn prop="title" label="标题" show-overflow-tooltip />
              <ElTableColumn prop="viewCount" label="浏览" width="70" />
              <ElTableColumn prop="likeCount" label="点赞" width="70" />
              <ElTableColumn prop="commentCount" label="评论" width="70" />
              <ElTableColumn prop="hotScore" label="热度分" width="70" />
            </ElTable>
          </ElCard>
        </ElCol>

        <!-- 热门板块 (lg: 7, md: 24, xs: 24) -->
        <ElCol :xs="24" :sm="24" :md="24" :lg="7" class="mb-16px">
          <ElCard class="chart-card">
            <template #header>
              <div class="flex-between">
                <span class="font-semibold">热门板块（按帖子数）</span>
              </div>
            </template>
            <ElTable :data="dashboardData.hotForums" stripe style="width: 100%">
              <ElTableColumn prop="forumName" label="板块" show-overflow-tooltip />
              <ElTableColumn prop="postCount" label="帖数" width="100" />
              <ElTableColumn label="增长" width="100">
                <template #default="{ row }">
                  <span class="down" :class="{ up: growthRate(row.growthRate) }">
                    {{ toFixedResponse(row.growthRate) }}
                  </span>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElCard>
        </ElCol>

        <!-- 发帖时段分布 (lg: 8, md: 24, xs: 24) -->
        <ElCol :xs="24" :sm="24" :md="24" :lg="8" class="mb-16px">
          <ElCard class="chart-card">
            <template #header>
              <div class="flex-between">
                <span class="font-semibold">发帖时段分布</span>
              </div>
            </template>
            <div ref="hourlyPostsChartRef" class="chart-container" />
          </ElCard>
        </ElCol>
      </ElRow>
    </ElSpace>
  </div>
</template>

<style scoped lang="scss">
.dashboard-container {
  min-height: 100vh;
  max-width: 100vw;
  // background-color: var(--el-bg-color);

  :deep(.el-card) {
    height: 100%;
  }

  :deep(.el-card__header) {
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  .chart-card {
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }
    .down {
      color: red;
    }
    .up {
      color: green;
    }
  }

  .chart-container {
    width: 100%;
    height: 350px;
    min-height: 350px;
  }

  .flex-between {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .flex-center {
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
