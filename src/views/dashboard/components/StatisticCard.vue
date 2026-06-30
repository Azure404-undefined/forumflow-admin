<script setup lang="ts">
import { ref } from 'vue';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  title: string;
  value: number;
  icon?: string;
  color?: string;
  fontSize?: number;
}

defineProps<Props>();

const isPositive = ref(true);
const rateValue = ref('');

const formatValue = (val: number) => {
  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(2)}M`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(2)}K`;
  }
  return val.toString();
};

const growthRate = (_val: number) => {
  // 模拟增长率计算
  const rate = Math.random() * 20 - 10; // 随机生成 -10% 到 +10% 的增长率
  if (rate >= 0) {
    isPositive.value = true;
  } else {
    isPositive.value = false;
  }
  rateValue.value = `${rate.toFixed(2)}%`;
  return rateValue.value;
};
</script>

<template>
  <ElCard class="statistic-card">
    <div class="card-content">
      <div class="card-icon">
        <SvgIcon :icon="icon" :color="color" :font-size="fontSize"></SvgIcon>
      </div>

      <div class="card-info">
        <div class="card-title">{{ title }}</div>
        <ElTooltip :content="formatValue(value)" placement="top">
          <div class="card-value">{{ formatValue(value) }}</div>
        </ElTooltip>
        <ElTooltip :content="growthRate(-11.45)" placement="top">
          <p>
            较昨日
            <span :class="{ positive: isPositive, negative: !isPositive }">{{ rateValue }}</span>
          </p>
        </ElTooltip>
      </div>
    </div>
  </ElCard>
</template>

<style scoped lang="scss">
.statistic-card {
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-card__body) {
    padding: 16px;
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .card-icon {
    flex-shrink: 0;
    width: 30px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    // background: linear-gradient(135deg, #4000a0 0%, #75beff 100%);
    border-radius: 8px;
    color: white;
    font-size: 30px;

    div {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .card-info {
    flex: 1;
    min-width: 0;
    p {
      // display: flex;
      // flex-direction: column;
      margin: 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    p .positive {
      // font-size: 16px;
      color: var(--el-color-success);
    }
    p .negative {
      // font-size: 16px;
      color: var(--el-color-danger);
    }
  }

  .card-title {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
