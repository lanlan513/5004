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
