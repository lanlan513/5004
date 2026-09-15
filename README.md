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

生产页面和 API 均由 `http://localhost:3001` 提供。服务端包含 history fallback，`/learn`、`/cases`、`/practice`、`/gaze` 与 `/works` 均支持直接刷新访问。

## 数据接口

- `GET /api/content`：全部统一内容
- `GET /api/content?type=lesson|case|exercise`：按内容类型筛选
- `GET /api/works`：读取作品
- `POST /api/works`：保存作品
- `GET /api/gaze/stats`：第一眼测试各作品的观察者落点统计
- `POST /api/gaze`：提交一次第一眼测试（`{ answers: [{ workId, x, y, latencyMs, hit }] }`）

知识、案例、练习和作品全部存储在统一的 `content` 表中，共享 `id / type / title / subtitle / body / meta / accent` 数据结构，页面只负责表现与交互。第一眼测试的会话与点击保存在 `gaze_sessions / gaze_clicks` 表。

## 第一眼测试（/gaze）

一次展示一张完整设计作品（人物、标题、产品、颜色区域四种观察目标），用户只有一次点击机会。提交后叠加显示：

1. **你的落点** — 醒目的用户标记；
2. **其他观察者的常见视觉焦点** — 基线数据 + 真实用户点击热力点；
3. **设计师预设核心区域** — 椭圆/矩形意图区域，并判定是否命中。

### 坐标方案

点击位置以**图片内部相对坐标**保存：`x = (clientX - rect.left) / rect.width`、`y = (clientY - rect.top) / rect.height`，取值 0–1，原点为图片左上角。计算只读取被点击 `<img>` 自身的 `getBoundingClientRect()`，**不依赖浏览器窗口或视口的固定宽高**，因此图片随容器缩放、窗口拉伸、设备像素比变化后，坐标仍能按百分比准确映射回作品。
