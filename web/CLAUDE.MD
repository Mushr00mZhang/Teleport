# 项目名称

传送门网页端

## 项目结构

- `cli` 构建、发布脚本（测试）
- `src/router` 路由
- `src/store` 状态管理
- `src/views` 页面组件
- `src/workers` 状态管理
- `src/store` Web worker

## 编码规范

- 样式遵循[Material Design 3](https://m3.material.io/)开发规范。
- 组件使用[Material Web](https://github.com/material-components/material-web/)，所有支持的[组件文档](https://github.com/material-components/material-web/blob/main/docs/components)在此。
- 所有标签的类以`teleport`开头，后续以各组件名称连接（`Main.vue`为`chat`），字母中间用`-`连接。
