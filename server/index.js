import express from 'express'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dbPath = path.join(__dirname, 'lab.sqlite')
const db = new DatabaseSync(dbPath)
db.exec(`CREATE TABLE IF NOT EXISTS content (id INTEGER PRIMARY KEY, type TEXT, title TEXT, subtitle TEXT, body TEXT, meta TEXT, accent TEXT);`)
db.exec(`CREATE TABLE IF NOT EXISTS gaze_sessions (id INTEGER PRIMARY KEY, created_at TEXT);`)
db.exec(`CREATE TABLE IF NOT EXISTS gaze_clicks (id INTEGER PRIMARY KEY, session_id INTEGER, work_id TEXT, x REAL, y REAL, latency_ms INTEGER, hit INTEGER);`)
const count = db.prepare("SELECT COUNT(*) as c FROM content WHERE type IN ('lesson','case','exercise')").get().c
if (!count) {
  const insert = db.prepare('INSERT INTO content (id,type,title,subtitle,body,meta,accent) VALUES (?,?,?,?,?,?,?)')
  const seed = [
    [1,'lesson','构图 / Composition','让画面产生方向感','构图不是把东西放上去，而是安排观看的路径。先确定主角，再决定留白与张力。','01 · 15 MIN · 基础','lime'],
    [2,'lesson','色彩 / Color','颜色是情绪的速度','从一个主色开始，建立对比，再给画面留下呼吸。色彩比例比颜色数量更重要。','02 · 20 MIN · 基础','orange'],
    [3,'lesson','字体 / Type','让文字拥有自己的性格','字体有重量、节奏和声音。把它当作形状看，而不只是信息。','03 · 18 MIN · 基础','purple'],
    [4,'lesson','视觉层级 / Hierarchy','让重要的事先被看见','大小、位置、留白与对比，共同决定阅读顺序。好版式会替用户做选择。','04 · 25 MIN · 进阶','blue'],
    [11,'case','Bauhaus · 1923','形式追随功能，也追随快乐','分析一张海报如何用基础形状建立秩序，并把复杂信息压缩成一眼可读的节奏。','CASE 01 · 海报','red'],
    [12,'case','Swiss Grid · 1950s','网格不是牢笼，是隐形骨架','看看网格如何让不同尺寸的文字、图片和留白保持同一套呼吸。','CASE 02 · 系统','yellow'],
    [13,'case','Experimental Type · 2024','当文字开始占据空间','案例拆解：把标题当成图像，尝试打破基线，让阅读变成一次探索。','CASE 03 · 字体','cyan'],
    [21,'exercise','30 秒构图挑战','移动三个形状，让视线抵达红点','使用画布中的圆、方、线，尝试做出一条明确的视觉路径。完成后保存你的作品。','练习 01 · 构图','lime'],
    [22,'exercise','色彩配比实验','70 / 20 / 10 的情绪公式','为画面选择主色、辅助色和强调色，观察比例改变时的感受差异。','练习 02 · 色彩','orange'],
    [23,'exercise','一句话排版','只用两种字号，做出层级','用有限的手段练习清晰表达：标题、正文、一个动作。','练习 03 · 版式','purple']
  ]
  for (const row of seed) insert.run(...row)
}
const app = express()
app.use(express.json({ limit: '16kb' }))
app.get('/api/content', (req,res) => {
  const type = req.query.type
  if (type && !['lesson','case','exercise','work'].includes(type)) return res.status(400).json({ error: 'Unsupported content type' })
  const rows = type ? db.prepare('SELECT * FROM content WHERE type=? ORDER BY id').all(type) : db.prepare('SELECT * FROM content ORDER BY id').all()
  res.json(rows)
})
app.get('/api/works', (req,res) => {
  const works = db.prepare("SELECT * FROM content WHERE type='work' ORDER BY id DESC").all()
  res.json(works.map(row => ({ id: row.id, title: row.title, author: row.subtitle, tags: row.body, created_at: row.meta })))
})
app.post('/api/works', (req,res) => {
  const { title, author='Anonymous', tags='composition' } = req.body || {}
  if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Title is required' })
  if (typeof author !== 'string' || typeof tags !== 'string') return res.status(400).json({ error: 'Invalid work data' })
  const cleanTitle = title.trim()
  const cleanAuthor = author.trim() || 'Anonymous'
  const cleanTags = tags.trim()
  if (cleanTitle.length > 80 || cleanAuthor.length > 40 || cleanTags.length > 120) return res.status(400).json({ error: 'Work data is too long' })
  const createdAt = new Date().toISOString()
  const info = db.prepare("INSERT INTO content (type,title,subtitle,body,meta,accent) VALUES ('work',?,?,?,?,?)").run(cleanTitle,cleanAuthor,cleanTags,createdAt,'lime')
  res.status(201).json({ id: Number(info.lastInsertRowid), title: cleanTitle, author: cleanAuthor, tags: cleanTags, created_at: createdAt })
})
// 第一眼测试：每张作品只保存一个点击点。
// x / y 为图片内部相对坐标（0–1，原点左上角），与显示尺寸无关。
const gazeWorkIds = ['person', 'title', 'product', 'color']
function gazeStats() {
  const rows = db.prepare('SELECT work_id, x, y FROM gaze_clicks ORDER BY id DESC LIMIT 800').all()
  const stats = {}
  for (const row of rows) {
    if (!stats[row.work_id]) stats[row.work_id] = { total: 0, recent: [] }
    const bucket = stats[row.work_id]
    bucket.total += 1
    if (bucket.recent.length < 60) bucket.recent.push([row.x, row.y])
  }
  return stats
}
app.get('/api/gaze/stats', (req,res) => {
  res.json(gazeStats())
})
app.post('/api/gaze', (req,res) => {
  const { answers } = req.body || {}
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > 8) {
    return res.status(400).json({ error: 'Answers are required' })
  }
  for (const a of answers) {
    if (!a || typeof a !== 'object') return res.status(400).json({ error: 'Invalid answer' })
    if (!gazeWorkIds.includes(a.workId)) return res.status(400).json({ error: 'Unknown work' })
    if (typeof a.x !== 'number' || typeof a.y !== 'number' || !Number.isFinite(a.x) || !Number.isFinite(a.y) || a.x < 0 || a.x > 1 || a.y < 0 || a.y > 1) {
      return res.status(400).json({ error: 'Click coordinates must be 0..1 relative to the image' })
    }
    if (a.latencyMs != null && (typeof a.latencyMs !== 'number' || a.latencyMs < 0 || a.latencyMs > 600000)) {
      return res.status(400).json({ error: 'Invalid latency' })
    }
  }
  const createdAt = new Date().toISOString()
  // node:sqlite 没有 better-sqlite3 的 db.transaction()，用显式事务语句。
  let sessionId
  try {
    db.exec('BEGIN')
    const info = db.prepare('INSERT INTO gaze_sessions (created_at) VALUES (?)').run(createdAt)
    sessionId = Number(info.lastInsertRowid)
    const insertClick = db.prepare('INSERT INTO gaze_clicks (session_id, work_id, x, y, latency_ms, hit) VALUES (?,?,?,?,?,?)')
    for (const a of answers) insertClick.run(sessionId, a.workId, a.x, a.y, a.latencyMs ?? null, a.hit ? 1 : 0)
    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
  res.status(201).json({ id: sessionId, created_at: createdAt, answers: answers.length, stats: gazeStats() })
})
app.use(express.static(path.join(root, 'dist')))
app.get(/.*/, (req,res) => {
  const file = path.join(root, 'dist', 'index.html')
  if (fs.existsSync(file)) res.sendFile(file); else res.sendFile(path.join(root,'index.html'))
})
app.listen(3001, () => console.log('Studio 14 API running on http://localhost:3001'))
