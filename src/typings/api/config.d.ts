declare namespace Api {
  namespace Config {
    // 配置项的值类型
    type ConfigValueType = 'string' | 'number' | 'boolean' | 'image' | 'json';

    // 单个配置项
    interface ConfigItem {
      key: string; // 配置键名，如 site_name
      value: any; // 配置值（根据type不同，可能是字符串、数字、布尔、URL等）
      type: ConfigValueType;
      label: string; // 显示名称
      group: string; // 分组标识，如 basic, seo, feature
      options?: any; // 可选，如开关的true/false描述或下拉选项
      placeholder?: string;
      helpText?: string;
    }

    // 配置分组
    interface ConfigGroup {
      groupKey: string; // 分组唯一标识
      groupName: string; // 分组显示名称
      items: ConfigItem[];
    }

    // 获取配置响应（分组数组）
    type ConfigResponse = ConfigGroup[];

    // 保存配置请求体（键值对）
    interface SaveConfigBody {
      [key: string]: any;
    }
  }
}
