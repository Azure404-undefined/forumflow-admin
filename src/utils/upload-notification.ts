import { type PropType, defineComponent, h, reactive } from 'vue';
import { ElNotification, ElProgress } from 'element-plus';
import type { AxiosProgressEvent } from 'axios';

const SUCCESS_NOTIFICATION_DELAY = 2000;

interface UploadNotificationState {
  percentage: number;
  total?: number;
  failed: boolean;
  message: string;
}

const UploadNotificationContent = defineComponent({
  props: {
    state: {
      type: Object as PropType<UploadNotificationState>,
      required: true
    }
  },
  setup(props) {
    return () =>
      h('div', { class: 'upload-notification-content' }, [
        h(ElProgress, {
          percentage: props.state.percentage,
          status: props.state.failed ? 'exception' : undefined,
          indeterminate: !props.state.total,
          'show-text': false
        }),
        h('span', props.state.message)
      ]);
  }
});

export function createUploadNotification(title: string) {
  const state = reactive<UploadNotificationState>({
    percentage: 0,
    failed: false,
    message: '正在准备上传'
  });

  let notification = ElNotification({
    title,
    message: h(UploadNotificationContent, { state }),
    type: 'info',
    duration: 0
  });

  function update(event: AxiosProgressEvent) {
    state.total = event.total;
    if (event.total) {
      state.percentage = Math.min(100, Math.round((event.loaded / event.total) * 100));
      state.message = `正在上传 ${state.percentage}%`;
    } else {
      state.message = '正在上传';
    }
  }

  function success() {
    state.percentage = 100;
    state.message = '上传完成';
    window.setTimeout(() => notification.close(), SUCCESS_NOTIFICATION_DELAY);
  }

  function fail(error: unknown) {
    state.failed = true;
    state.message = isTimeoutError(error) ? '上传超时，请重试' : '上传失败，请重试';
    notification.close();
    notification = ElNotification({
      title,
      message: h(UploadNotificationContent, { state }),
      type: 'warning',
      duration: 4500
    });
  }

  return { update, success, fail };
}

function isTimeoutError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const requestError = error as { code?: string; message?: string };
  return (
    requestError.code === 'ECONNABORTED' ||
    requestError.code === 'ETIMEDOUT' ||
    requestError.message?.includes('timeout')
  );
}
