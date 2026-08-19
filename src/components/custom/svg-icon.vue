<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { CSSProperties } from 'vue';
import { Icon } from '@iconify/vue/offline';

defineOptions({ name: 'SvgIcon', inheritAttrs: false });

/**
 * Props
 *
 * - Support iconify and local svg icon
 * - If icon and localIcon are passed at the same time, localIcon will be rendered first
 */
interface Props {
  /** Iconify icon name */
  icon?: string;
  /** Local svg icon name */
  localIcon?: string;
  /** Icon color */
  color?: string;
  /** Icon font size in px */
  fontSize?: number;
}

const props = defineProps<Props>();

const attrs = useAttrs();

/**
 * Bind attrs: 合并来自外部的 `style`（可能是 string 或 object）和 props 提供的 `color` / `fontSize`，
 * 只透传 `class` 与 `style` 到内部的 `<svg>` 或 `Icon`。
 */
const bindAttrs = computed(() => {
  const cls = (attrs.class as string) || '';

  const rawStyle = attrs.style as unknown as string | CSSProperties | undefined;

  let style: string | CSSProperties | '' = '';

  if (typeof rawStyle === 'string') {
    let styleStr = rawStyle.trim();
    if (props.color) {
      if (styleStr && !styleStr.endsWith(';')) styleStr += ';';
      styleStr += `color: ${props.color};`;
    }
    if (props.fontSize) {
      styleStr += `font-size: ${props.fontSize}px;`;
    }
    style = styleStr;
  } else if (rawStyle && typeof rawStyle === 'object') {
    style = { ...(rawStyle as CSSProperties) };
    if (props.color) (style as CSSProperties).color = props.color;
    if (props.fontSize) (style as CSSProperties).fontSize = `${props.fontSize}px`;
  } else if (props.color || props.fontSize) {
    style = {} as CSSProperties;
    if (props.color) (style as CSSProperties).color = props.color;
    if (props.fontSize) (style as CSSProperties).fontSize = `${props.fontSize}px`;
  } else {
    style = '';
  }

  return {
    class: cls || '',
    style: style as any
  };
});

const symbolId = computed(() => {
  const { VITE_ICON_LOCAL_PREFIX: prefix } = import.meta.env;

  const defaultLocalIcon = 'no-icon';

  const icon = props.localIcon || defaultLocalIcon;

  return `#${prefix}-${icon}`;
});

/** If localIcon is passed, render localIcon first */
const renderLocalIcon = computed(() => props.localIcon || !props.icon);
</script>

<template>
  <template v-if="renderLocalIcon">
    <svg aria-hidden="true" width="1em" height="1em" v-bind="bindAttrs">
      <use :xlink:href="symbolId" fill="currentColor" />
    </svg>
  </template>
  <template v-else>
    <Icon v-if="icon" :icon="icon" v-bind="bindAttrs" />
  </template>
</template>

<style scoped></style>
