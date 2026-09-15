import express from 'express'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dbPath = path.join(__dirname, 'lab.sqlite')
const db = new DatabaseSync(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY,
    type TEXT,
    title TEXT,
    subtitle TEXT,
    body TEXT,
    meta TEXT,
    accent TEXT
  );

  CREATE TABLE IF NOT EXISTS task_options (
    id INTEGER PRIMARY KEY,
    category TEXT NOT NULL,
    label TEXT NOT NULL,
    hint TEXT NOT NULL,
    sort INTEGER NOT NULL DEFAULT 0,
    UNIQUE(category, label)
  );

  CREATE TABLE IF NOT EXISTS draw_tasks (
    id INTEGER PRIMARY KEY,
    brief TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    result TEXT,
    draft TEXT,
    reflection TEXT,
    created_at TEXT NOT NULL,
    submitted_at TEXT
  );
`)

const drawTaskColumns = db.prepare('PRAGMA table_info(draw_tasks)').all().map(column => column.name)
if (!drawTaskColumns.includes('draft')) db.exec('ALTER TABLE draw_tasks ADD COLUMN draft TEXT')

const contentCount = db.prepare("SELECT COUNT(*) as c FROM content WHERE type IN ('lesson','case','exercise')").get().c
if (!contentCount) {
  const insertContent = db.prepare('INSERT INTO content (id,type,title,subtitle,body,meta,accent) VALUES (?,?,?,?,?,?,?)')
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
  for (const row of seed) insertContent.run(...row)
}

const optionSeed = [
  ['theme','城市深夜便利店','让熟悉的小空间拥有故事感',0],
  ['theme','一场只下十分钟的雨','用画面表现短暂、速度和情绪',1],
  ['theme','旧书交换计划','传达手感、时间痕迹与共享',2],
  ['theme','火星上的第一家茶馆','把东方日常放进未来想象',3],
  ['theme','无屏日公共活动','鼓励人们暂时离开电子屏幕',4],
  ['theme','社区声音地图','把看不见的声音变成视觉线索',5],
  ['theme','儿童自然观察营','让好奇心和安全感同时出现',6],
  ['theme','二手衣物修复工坊','强调修补、延续和可持续',7],
  ['theme','深夜诗歌自助贩卖机','让文字像商品一样被偶然买到',8],
  ['theme','城市鸟类观察指南','把科普信息做得轻盈、醒目',9],

  ['audience','刚开始独立生活的大学生','他们需要快速理解，也愿意被有趣的表达吸引',0],
  ['audience','通勤中的年轻上班族','信息必须在几秒内被抓住',1],
  ['audience','带孩子逛展的家庭家长','既要可信，也要让孩子愿意靠近',2],
  ['audience','退休后的城市新学习者','清晰、亲切，避免过度潮流化',3],
  ['audience','独立设计师与创意人','他们会留意形式、质感和概念完整度',4],
  ['audience','第一次到访城市的游客','需要明确方向，同时保留探索感',5],
  ['audience','中学生科技社团成员','语气直接，视觉可以更大胆',6],
  ['audience','附近社区的小店主','方案需要务实、易读、低成本可执行',7],
  ['audience','关注环保的城市青年','价值感要明确，但避免空洞口号',8],
  ['audience','艺术馆夜间活动参与者','可以接受更实验、更有氛围的表达',9],

  ['scene','手机锁屏通知','画面必须在小尺寸和瞬间浏览中成立',0],
  ['scene','地铁站台灯箱','距离远、停留短，需要强主视觉',1],
  ['scene','咖啡馆桌面立牌','近距离阅读，可以保留细节和语气',2],
  ['scene','社区公告栏','信息复杂，需要清楚的层级',3],
  ['scene','活动入口易拉宝','远看抓主题，近看获得行动信息',4],
  ['scene','社交媒体方图','在密集信息流里制造停顿',5],
  ['scene','明信片正面','允许情绪化，也需要被收藏',6],
  ['scene','展会导览手册封面','需要建立期待并暗示内容结构',7],
  ['scene','电子手表小屏提示','空间极少，每个元素都要承担作用',8],

  ['constraint','只允许使用两种颜色','用对比、面积和留白制造变化',0],
  ['constraint','标题必须放在画面边缘','尝试让边界成为构图的一部分',1],
  ['constraint','不能出现任何摄影图片','只能用字体、形状和线条完成',2],
  ['constraint','必须保留至少 40% 留白','克制元素数量，让主角更明确',3],
  ['constraint','主标题只允许使用一种字号','依靠位置、重量和空间建立层级',4],
  ['constraint','所有图形必须使用圆形','用大小、重叠和裁切制造节奏',5],
  ['constraint','整体只能使用几何无衬线字体','让现代感和秩序感成为核心',6],
  ['constraint','必须包含一个倾斜 15° 的元素','让稳定画面中出现一次动势',7],
  ['constraint','信息需要在 3 秒内读完','删掉所有不能帮助理解的内容',8]
]

const insertOption = db.prepare('INSERT OR IGNORE INTO task_options (category,label,hint,sort) VALUES (?,?,?,?)')
for (const option of optionSeed) insertOption.run(...option)

const pickOption = db.prepare('SELECT * FROM task_options WHERE category = ? ORDER BY RANDOM() LIMIT 1')
const insertDrawTask = db.prepare('INSERT INTO draw_tasks (brief,status,created_at) VALUES (?,?,?)')
const selectDrawTask = db.prepare('SELECT * FROM draw_tasks WHERE id = ?')
const selectDrawTasks = db.prepare('SELECT * FROM draw_tasks WHERE status = ? ORDER BY submitted_at DESC, id DESC')
const selectActiveDrawTasks = db.prepare("SELECT * FROM draw_tasks WHERE status = 'active' ORDER BY id DESC")
const discardActiveDrawTasks = db.prepare("UPDATE draw_tasks SET status = 'discarded' WHERE status = 'active'")
const saveDraftDrawTask = db.prepare('UPDATE draw_tasks SET draft = ? WHERE id = ?')
const submitDrawTask = db.prepare('UPDATE draw_tasks SET status = ?, result = ?, reflection = ?, submitted_at = ? WHERE id = ?')

function pickBrief() {
  return {
    theme: pickOption.get('theme'),
    audience: pickOption.get('audience'),
    scene: pickOption.get('scene'),
    constraint: pickOption.get('constraint')
  }
}

function briefPart(option) {
  return { label: option.label, hint: option.hint }
}

function serializeBrief(brief) {
  return JSON.stringify({
    theme: briefPart(brief.theme),
    audience: briefPart(brief.audience),
    scene: briefPart(brief.scene),
    constraint: briefPart(brief.constraint)
  })
}

function normalizeBrief(rawBrief) {
  const brief = typeof rawBrief === 'string' ? JSON.parse(rawBrief) : rawBrief
  const hints = brief.hints || {}
  for (const key of ['theme','audience','scene','constraint']) {
    if (typeof brief[key] === 'string') {
      brief[key] = { label: brief[key], hint: hints[key] || '' }
    }
  }
  delete brief.hints
  return brief
}

function mapTask(row) {
  return {
    id: row.id,
    brief: normalizeBrief(row.brief),
    status: row.status,
    result: row.result ? JSON.parse(row.result) : null,
    draft: row.draft ? JSON.parse(row.draft) : null,
    reflection: row.reflection || '',
    created_at: row.created_at,
    submitted_at: row.submitted_at
  }
}

const resultEnums = {
  palette: ['signal','night','paper','grape','aqua'],
  fontFamily: ['geometric','serif'],
  layout: ['hero','split','grid','diagonal','frame'],
  motif: ['circle','bars','type','line','star'],
  density: [1,2,3]
}

function asString(value, maxLength) {
  return typeof value === 'string' && value.trim().length <= maxLength ? value.trim() : null
}

function validateResult(result) {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null
  const output = {}
  for (const [key, allowed] of Object.entries(resultEnums)) {
    if (!allowed.includes(result[key])) return null
    output[key] = result[key]
  }
  output.headline = asString(result.headline, 40)
  output.subline = asString(result.subline, 70)
  if (!output.headline || !output.subline) return null
  return output
}

function validateDraft(draft) {
  if (!draft || typeof draft !== 'object' || Array.isArray(draft)) return null
  const result = draft.result
  if (!result || typeof result !== 'object' || Array.isArray(result)) return null
  const output = { result: {} }
  for (const [key, allowed] of Object.entries(resultEnums)) {
    if (!allowed.includes(result[key])) return null
    output.result[key] = result[key]
  }
  if (typeof result.headline !== 'string' || typeof result.subline !== 'string') return null
  if (result.headline.length > 40 || result.subline.length > 70) return null
  output.result.headline = result.headline
  output.result.subline = result.subline

  const reflection = draft.reflection ?? ''
  if (typeof reflection !== 'string' || reflection.length > 280) return null
  output.reflection = reflection
  return output
}

const app = express()
app.use(express.json({ limit: '16kb' }))

app.get('/api/content', (req,res) => {
  const type = req.query.type
  if (type && !['lesson','case','exercise','work'].includes(type)) return res.status(400).json({ error: 'Unsupported content type' })
  const rows = type ? db.prepare('SELECT * FROM content WHERE type=? ORDER BY id').all(type) : db.prepare('SELECT * FROM content ORDER BY id').all()
  res.json(rows)
})

app.post('/api/draw-tasks', (req,res) => {
  const brief = pickBrief()
  const createdAt = new Date().toISOString()
  discardActiveDrawTasks.run()
  const info = insertDrawTask.run(serializeBrief(brief), 'active', createdAt)
  const row = selectDrawTask.get(Number(info.lastInsertRowid))
  res.status(201).json(mapTask(row))
})

app.get('/api/draw-tasks/active', (req,res) => {
  const row = selectActiveDrawTasks.get()
  if (!row) return res.json(null)
  res.json(mapTask(row))
})

app.get('/api/draw-tasks/:id', (req,res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid task id' })
  const row = selectDrawTask.get(id)
  if (!row) return res.status(404).json({ error: 'Task not found' })
  res.json(mapTask(row))
})

app.put('/api/draw-tasks/:id/draft', (req,res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid task id' })
  const row = selectDrawTask.get(id)
  if (!row) return res.status(404).json({ error: 'Task not found' })
  if (row.status !== 'active') return res.status(409).json({ error: 'Task cannot be edited' })

  const draft = validateDraft(req.body)
  if (!draft) return res.status(400).json({ error: 'Invalid draft data' })
  saveDraftDrawTask.run(JSON.stringify(draft), id)
  res.json(mapTask(selectDrawTask.get(id)))
})

app.get('/api/draw-tasks', (req,res) => {
  const rows = selectDrawTasks.all('submitted')
  res.json(rows.map(mapTask))
})

app.post('/api/draw-tasks/:id/submit', (req,res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Invalid task id' })

  const row = selectDrawTask.get(id)
  if (!row) return res.status(404).json({ error: 'Task not found' })
  if (row.status === 'submitted') return res.status(409).json({ error: 'Task has already been submitted' })

  const result = validateResult(req.body?.result)
  const reflection = asString(req.body?.reflection ?? '', 280)
  if (!result) return res.status(400).json({ error: 'A complete visual result is required' })
  if (reflection === null) return res.status(400).json({ error: 'Reflection is too long' })

  const submittedAt = new Date().toISOString()
  submitDrawTask.run('submitted', JSON.stringify(result), reflection, submittedAt, id)
  res.status(201).json(mapTask(selectDrawTask.get(id)))
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

app.use(express.static(path.join(root, 'dist')))
app.get(/.*/, (req,res) => {
  const file = path.join(root, 'dist', 'index.html')
  if (fs.existsSync(file)) res.sendFile(file); else res.sendFile(path.join(root,'index.html'))
})

app.listen(3001, () => console.log('Studio 14 API running on http://localhost:3001'))
