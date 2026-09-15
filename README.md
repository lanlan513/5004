# Studio 14 · 平面设计学习实验室

一个面向设计初学者的互动全栈 Web 项目。内容围绕构图、色彩、字体、版式、视觉层级与设计思维展开，以设计工作室式的互动空间代替传统课程首页。

## 本地开发

需要 Node.js 22.5 或更高版本（项目使用 Node 内置 SQLite）。

```bash
npm install
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:3001

## 生产运行

```bash
npm run build
npm start
```

生产页面和 API 均由 `http://localhost:3001` 提供。服务端包含 history fallback，`/learn`、`/cases`、`/practice` 与 `/works` 均支持直接刷新访问。

## 数据接口

- `GET /api/content`：全部统一内容
- `GET /api/content?type=lesson|case|exercise`：按内容类型筛选
- `POST /api/draw-tasks`：服务端随机生成一张设计任务 brief
- `GET /api/draw-tasks/active`：读取最近一张尚未提交的任务和自动保存的设计草稿
- `PUT /api/draw-tasks/:id/draft`：自动保存未提交任务的配色、版式、文案等草稿状态
- `GET /api/draw-tasks`：读取已经提交的抽签任务与最终视觉方案
- `POST /api/draw-tasks/:id/submit`：提交指定任务的视觉结果和设计备注
- `GET /api/works`：读取作品
- `POST /api/works`：保存作品

知识、案例和练习存储在统一的 `content` 表中，共享 `id / type / title / subtitle / body / meta / accent` 数据结构。抽签器使用独立的 `task_options` 与 `draw_tasks` 表：随机主题、目标人群、场景和限制由 API 组合生成，编辑中的草稿会自动保存到当前任务，提交时完整保存 brief、视觉参数与备注，不做自动评分。
