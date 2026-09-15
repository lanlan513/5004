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
- `GET /api/works`：读取作品
- `POST /api/works`：保存作品

知识、案例、练习和作品全部存储在统一的 `content` 表中，共享 `id / type / title / subtitle / body / meta / accent` 数据结构，页面只负责表现与交互。

## 文字观察器（/type-observer）

一个独立的排版实验工作台：输入任意一句话，在**标题 / 正文 / 注释**三个层级上同时试验字体、字号、字重、行距与字距，观察参数变化如何重塑信息层级。

- **六组风格化字体组合**：瑞士网格、经典编辑、东方留白、极简科技、海报视觉、高定优雅，每组附适用的真实设计场景（SaaS 官网、杂志专栏、文博品牌、开发者工具、潮流海报、奢侈品等）。
- **排版方案**：调整结果可命名保存（localStorage，键名 `type-observer-schemes-v1`），随时重新载入，并支持 JSON 导入 / 导出；`⌘/Ctrl + S` 快速保存。草稿自动暂存（`type-observer-draft-v1`）。
- **异步字体与防白字**：Google Fonts 样式表在首屏渲染后动态注入（`display=swap`），文字始终先用 `FONT_LIBRARY` 中内置的中西文 fallback 栈立即渲染；`src/type-observer/fontLoader.js` 通过 `document.fonts.load/check` 对每个字体族做探针检测，加载成功后浏览器无感替换，失败或 12 秒超时则保留系统备用字体并显示状态与「重试」入口。任何网络情况下页面都不会出现空白文字。
- **辅助观察**：右侧面板实时显示每个层级的行高盒高、行数 × 段落数、每行约容纳字符数与标题:正文:注释字号比；舞台支持版心宽度调节与基线网格叠加。

