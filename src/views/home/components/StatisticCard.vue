<script setup lang="ts">
import { computed } from 'vue';
import SvgIcon from '@/components/custom/svg-icon.vue';

interface Props {
  title: string;
  value: number;
  growthRate?: number;
  icon?: string;
  color?: string;
  fontSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  growthRate: 0,
  icon: '',
  color: 'currentColor',
  fontSize: 30
});

const isPositive = computed(() => props.growthRate >= 0);
const rateValue = computed(() => `${props.growthRate.toFixed(2)}%`);

function formatValue(val: number) {
  if (val >= 1000000) {
    return `${(val / 1000000).toFixed(2)}M`;
  }
  if (val >= 1000) {
    return `${(val / 1000).toFixed(2)}K`;
  }
  return val.toString();
}
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
        <ElTooltip :content="rateValue" placement="top">
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
      margin: 0;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    p .positive {
      color: var(--el-color-success);
    }

    p .negative {
      color: var(--el-color-danger);
    }
  }

  .card-title {
    margin-bottom: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-value {
    color: var(--el-text-color-primary);
    font-size: 20px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
