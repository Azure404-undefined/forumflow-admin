<!-- richTextEditor.vue -->
<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'; // 引入核心 css
import { nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { ElMessage } from 'element-plus';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor, IToolbarConfig } from '@wangeditor/editor';
import { uploadImage, uploadVideo } from '@/service/api/post';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
}>();

// 编辑器的内容，可以用 v-model 双向绑定
const valueHtml = ref('');

// 编辑器实例，必须用 shallowRef
const editorRef = shallowRef<IDomEditor>();

// 工具栏配置 —— 仅保留表情、图片、视频
const toolbarConfig: Partial<IToolbarConfig> = {
  toolbarKeys: ['emotion', 'uploadImage', 'uploadVideo']
};

// 编辑器核心配置
const editorConfig = {
  placeholder: '请输入内容...',
  MENU_CONF: {
    uploadImage: {
      customUpload: async (
        file: File,
        insertFn: (url: string | undefined, alt: string | undefined, href: string | undefined) => void
      ) => {
        // file 即选中的图片文件，insertFn 可将图片插入编辑器
        try {
          // 调用后端上传接口
          const res = await uploadImage(file);
          // 后端返回图片URL、alt和href，插入到编辑器中
          insertFn(res.data?.url, res.data?.alt, res.data?.href);
        } catch {
          ElMessage.error('图片上传失败，请重试');
        }
      }
    },
    uploadVideo: {
      customUpload: async (file: File, insertFn: (url: string | undefined, poster: string | undefined) => void) => {
        // file 即选中的图片文件，insertFn 可将视频插入编辑器
        try {
          // 调用后端上传接口
          const res = await uploadVideo(file);
          // 后端返回视频
          insertFn(res.data?.url, res.data?.poster);
        } catch {
          ElMessage.error('视频上传失败，请重试');
        }
      }
    }
  }
};

// 组件创建时，记录编辑器实例
const handleCreated = (editor: IDomEditor) => {
  editorRef.value = editor; // 记录 editor 实例，重要！
  editor.setHtml(props.modelValue);
  valueHtml.value = props.modelValue;
};

// 监听编辑器内容变化，及时更新父组件
const handleChange = () => {
  valueHtml.value = editorRef.value?.getHtml() || ''; // 获取编辑器内容
  emit('update:modelValue', valueHtml.value); // 通过事件通知父组件更新
};

useDebounceFn(handleChange, 500); // 防抖，避免频繁触发更新

// 监听父组件content更新
watch(
  () => props.modelValue,
  v => {
    nextTick(() => {
      if (editorRef.value && v !== valueHtml.value) {
        editorRef.value.setHtml(v);
        valueHtml.value = v;
      }
    });
  }
);

// 组件销毁时，也销毁编辑器实例
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor === null) return;
  editor?.destroy();
});
</script>

<template>
  <div>
    <Editor
      v-model="valueHtml"
      style="height: 100%; overflow-y: auto"
      :default-config="editorConfig"
      mode="default"
      @on-created="handleCreated"
      @on-change="handleChange"
    />
    <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="default" />
  </div>
</template>
