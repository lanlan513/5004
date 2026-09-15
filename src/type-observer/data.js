// 文字观察器 · 数据层
// 字体库：每个字体都带完整 fallback 栈，保证网络字体未到达 / 不可用时绝不出现空白文字。

export const STORAGE_SCHEMES = 'type-observer-schemes-v1'
export const STORAGE_DRAFT = 'type-observer-draft-v1'

export const LEVELS = [
  { key: 'title', label: '标题', en: 'TITLE' },
  { key: 'body', label: '正文', en: 'BODY' },
  { key: 'note', label: '注释', en: 'NOTE' }
]

export const WEIGHT_LABELS = {
  100: '细体 Thin',
  200: '特细 ExtraLight',
  300: '轻体 Light',
  400: '常规 Regular',
  500: '中等 Medium',
  600: '半粗 Semibold',
  700: '粗体 Bold',
  800: '特粗 ExtraBold',
  900: '黑体 Black'
}

// weights:
//   { type:'range', min, max, step }  可变 / 多字重字体
//   { type:'fixed', values:[...] }    仅提供离散字重的字体
export const FONT_LIBRARY = {
  inter: {
    label: 'Inter',
    google: 'Inter:wght@100..900',
    weights: { type: 'range', min: 100, max: 900, step: 100 },
    stack: "'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,sans-serif"
  },
  spaceGrotesk: {
    label: 'Space Grotesk',
    google: 'Space+Grotesk:wght@300..700',
    weights: { type: 'range', min: 300, max: 700, step: 100 },
    stack: "'Space Grotesk','Noto Sans SC','PingFang SC',system-ui,sans-serif"
  },
  montserrat: {
    label: 'Montserrat',
    google: 'Montserrat:wght@100..900',
    weights: { type: 'range', min: 100, max: 900, step: 100 },
    stack: "'Montserrat','Noto Sans SC','PingFang SC',system-ui,sans-serif"
  },
  playfair: {
    label: 'Playfair Display',
    google: 'Playfair+Display:ital,wght@0,400..900;1,400..900',
    weights: { type: 'fixed', values: [400, 500, 600, 700, 800, 900] },
    stack: "'Playfair Display','Noto Serif SC','Songti SC','SimSun',Georgia,serif"
  },
  cormorant: {
    label: 'Cormorant Garamond',
    google: 'Cormorant+Garamond:ital,wght@0,300..700;1,300..700',
    weights: { type: 'fixed', values: [300, 400, 500, 600, 700] },
    stack: "'Cormorant Garamond','Noto Serif SC','Songti SC',Georgia,serif"
  },
  notoSans: {
    label: 'Noto Sans SC 思源黑体',
    google: 'Noto+Sans+SC:wght@100..900',
    weights: { type: 'range', min: 100, max: 900, step: 100 },
    cjk: true,
    stack: "'Noto Sans SC','PingFang SC','Hiragino Sans GB','Microsoft YaHei',system-ui,sans-serif"
  },
  notoSerif: {
    label: 'Noto Serif SC 思源宋体',
    google: 'Noto+Serif+SC:wght@200..900',
    weights: { type: 'range', min: 200, max: 900, step: 100 },
    cjk: true,
    stack: "'Noto Serif SC','Songti SC','STSong','SimSun',Georgia,serif"
  },
  dmMono: {
    label: 'DM Mono',
    google: 'DM+Mono:ital,wght@0,300;0,400;0,500;1,400',
    weights: { type: 'fixed', values: [300, 400, 500] },
    stack: "'DM Mono','Noto Sans SC',ui-monospace,Menlo,Consolas,monospace"
  },
  jetbrains: {
    label: 'JetBrains Mono',
    google: 'JetBrains+Mono:ital,wght@0,100..800;1,100..800',
    weights: { type: 'fixed', values: [100, 200, 300, 400, 500, 600, 700, 800] },
    stack: "'JetBrains Mono','Noto Sans SC',ui-monospace,'SF Mono',Menlo,Consolas,monospace"
  },
  bebas: {
    label: 'Bebas Neue',
    google: 'Bebas+Neue',
    weights: { type: 'fixed', values: [400] },
    stack: "'Bebas Neue','Noto Sans SC','Arial Narrow','PingFang SC',sans-serif"
  },
  archivoBlack: {
    label: 'Archivo Black',
    google: 'Archivo+Black',
    weights: { type: 'fixed', values: [400] },
    stack: "'Archivo Black','Noto Sans SC','Arial Black','PingFang SC',sans-serif"
  },
  systemSans: {
    label: '系统无衬线（零等待）',
    system: true,
    weights: { type: 'range', min: 100, max: 900, step: 100 },
    stack: "system-ui,-apple-system,'PingFang SC','Hiragino Sans GB','Microsoft YaHei','Segoe UI',sans-serif"
  },
  systemSerif: {
    label: '系统衬线（零等待）',
    system: true,
    weights: { type: 'range', min: 200, max: 900, step: 100 },
    stack: "Georgia,'Songti SC','STSong','SimSun','Times New Roman',serif"
  },
  systemMono: {
    label: '系统等宽（零等待）',
    system: true,
    weights: { type: 'fixed', values: [400, 500, 700] },
    stack: "ui-monospace,'SF Mono','Cascadia Code',Menlo,Consolas,'Courier New',monospace"
  }
}

// 字体在选择器中的分组
export const FONT_GROUPS = [
  { group: '现代无衬线 Sans', ids: ['inter', 'spaceGrotesk', 'montserrat', 'notoSans'] },
  { group: '经典衬线 Serif', ids: ['playfair', 'cormorant', 'notoSerif'] },
  { group: '等宽 Mono', ids: ['dmMono', 'jetbrains'] },
  { group: '展示 Display', ids: ['bebas', 'archivoBlack'] },
  { group: '本机系统字体（离线可用）', ids: ['systemSans', 'systemSerif', 'systemMono'] }
]

// 把任意字重吸附到字体真实支持的最近值
export function snapWeight(fontId, weight) {
  const spec = FONT_LIBRARY[fontId]
  if (!spec) return weight
  const w = spec.weights
  if (w.type === 'range') return Math.min(w.max, Math.max(w.min, Math.round(weight / w.step) * w.step))
  let best = w.values[0]
  let dist = Infinity
  for (const v of w.values) {
    const d = Math.abs(v - weight)
    if (d < dist) { dist = d; best = v }
  }
  return best
}

// 六组风格差异明显的字体组合 —— 参数经过设计取舍，不只是换字体
export const FONT_COMBOS = [
  {
    id: 'swiss',
    name: '瑞士网格',
    en: 'SWISS GRID · 01',
    scenes: ['科技产品官网', 'SaaS 与后台系统', '数据仪表盘', '信息密度高的界面'],
    desc: '中性无衬面配合紧排标题，层级完全靠字重与字号拉开。冷静、可信、可读性优先。',
    levels: {
      title: { family: 'inter', weight: 800, size: 46, lineHeight: 1.08, tracking: -0.02 },
      body: { family: 'inter', weight: 400, size: 16, lineHeight: 1.7, tracking: 0 },
      note: { family: 'dmMono', weight: 400, size: 11, lineHeight: 1.6, tracking: 0.08 }
    }
  },
  {
    id: 'editorial',
    name: '经典编辑',
    en: 'EDITORIAL SERIF · 02',
    scenes: ['杂志与长文阅读', '出版物与专栏', '文化品牌', '文学类产品'],
    desc: '高对比衬线做标题，宋体承接正文，注释用小字宽字距。纸面感、权威、适合慢阅读。',
    levels: {
      title: { family: 'playfair', weight: 700, size: 48, lineHeight: 1.12, tracking: 0.005 },
      body: { family: 'notoSerif', weight: 400, size: 16.5, lineHeight: 1.85, tracking: 0.01 },
      note: { family: 'dmMono', weight: 400, size: 10.5, lineHeight: 1.6, tracking: 0.14 }
    }
  },
  {
    id: 'oriental',
    name: '东方留白',
    en: 'ORIENTAL RHYTHM · 03',
    scenes: ['文博与展览', '茶 / 酒 / 香包装', '国潮品牌', '高端酒店餐饮'],
    desc: '思源宋体统揽全局，标题用轻字重与宽字距制造呼吸感，行距刻意拉大，讲究「疏可走马」。',
    levels: {
      title: { family: 'notoSerif', weight: 300, size: 42, lineHeight: 1.35, tracking: 0.35 },
      body: { family: 'notoSerif', weight: 400, size: 15.5, lineHeight: 2.0, tracking: 0.06 },
      note: { family: 'notoSans', weight: 300, size: 11, lineHeight: 1.9, tracking: 0.3 }
    }
  },
  {
    id: 'monoTech',
    name: '极简科技',
    en: 'MONO TECH · 04',
    scenes: ['开发者工具', '技术文档与 changelog', 'AI / 数据产品', '极客风发布会'],
    desc: '几何无衬线标题 + 等宽正文，等宽字让数据、代码与中英文混排天然对齐，工程感十足。',
    levels: {
      title: { family: 'spaceGrotesk', weight: 700, size: 44, lineHeight: 1.1, tracking: -0.01 },
      body: { family: 'jetbrains', weight: 400, size: 14, lineHeight: 1.75, tracking: 0 },
      note: { family: 'jetbrains', weight: 500, size: 11, lineHeight: 1.6, tracking: 0.04 }
    }
  },
  {
    id: 'poster',
    name: '海报视觉',
    en: 'DISPLAY POSTER · 05',
    scenes: ['主视觉海报', '潮流服饰', '音乐节与展览标题', '电商大促 Banner'],
    desc: '窄身压缩展示字让标题像图形一样占据空间，正文用粗黑保证街头远观的冲击力。慎用长文本。',
    levels: {
      title: { family: 'bebas', weight: 400, size: 68, lineHeight: 0.98, tracking: 0.02 },
      body: { family: 'archivoBlack', weight: 400, size: 15, lineHeight: 1.5, tracking: 0.01 },
      note: { family: 'inter', weight: 600, size: 11, lineHeight: 1.5, tracking: 0.22 }
    }
  },
  {
    id: 'haute',
    name: '高定优雅',
    en: 'HAUTE ÉLÉGANCE · 06',
    scenes: ['奢侈品与珠宝', '婚礼请柬', '高端美妆', '精品酒店与米其林餐厅'],
    desc: 'Didone 风格的纤细衬线配几何无衬线小字，大量字距与留白，传递克制的昂贵感。',
    levels: {
      title: { family: 'cormorant', weight: 500, size: 50, lineHeight: 1.15, tracking: 0.02 },
      body: { family: 'montserrat', weight: 300, size: 15, lineHeight: 1.9, tracking: 0.04 },
      note: { family: 'montserrat', weight: 500, size: 10.5, lineHeight: 1.7, tracking: 0.32 }
    }
  }
]

export const DEFAULT_TEXTS = {
  title: '文字观察器',
  body: '输入任意一句话，把它同时放在标题、正文与注释三个层级里。调整字体、字号、字重、行距与字距，观察同一条信息如何在尺度变化中被重新组织——这就是排版的工作。',
  note: 'NOTE / 01 · 所有参数即时生效，字体采用异步加载并自动回退到系统备用字体'
}

// 「一句话实验」的示例句
export const SAMPLE_SENTENCES = [
  '留白不是空无，是给信息安排呼吸的节奏。',
  'GOOD TYPE IS LIKE A CLEAR VOICE.',
  '字号决定主角，字距决定语气，行距决定耐心。',
  '层级来自对比，而对比首先来自尺度。'
]

export const DEFAULT_STATE = {
  comboId: 'swiss',
  activeLevel: 'title',
  stageWidth: 720,
  gridOn: false,
  texts: { ...DEFAULT_TEXTS },
  levels: FONT_COMBOS[0].levels
}

/* ----------------------------- 数据校验 / 消毒 ----------------------------- */
// 任何来自 localStorage / 导入 JSON / URL 的方案数据都必须经过这里，
// 保证字体 ID 存在、数值字段是有限数字且落在合理区间，页面在任意数据下都可渲染。

export const LIMITS = {
  size: { min: 10, max: 96, step: 1 },
  weight: { min: 100, max: 900, step: 100 },
  lineHeight: { min: 1, max: 2.4, step: 0.05 },
  tracking: { min: -0.05, max: 0.5, step: 0.01 }
}

function finiteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v)
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v))
}

// 消毒单个层级配置。返回 { value, fixes: string[] }
export function sanitizeLevel(raw, fallback) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const fixes = []

  // family：必须是字体库中存在的 ID，否则回退默认字体
  let family = fallback.family
  if (typeof src.family === 'string' && FONT_LIBRARY[src.family]) {
    family = src.family
  } else if (src.family !== undefined) {
    fixes.push(`字体「${String(src.family)}」不在字体库`)
  }

  const pickNum = (key, defVal) => {
    // 数字或可转换为有限数字的字符串都接受（JSON 里的 "16" 不应被丢弃），其余回退
    const n = typeof src[key] === 'string' ? Number(src[key].trim()) : src[key]
    if (!finiteNumber(n)) return defVal
    return clamp(n, LIMITS[key].min, LIMITS[key].max)
  }

  let size = pickNum('size', fallback.size)
  let lineHeight = pickNum('lineHeight', fallback.lineHeight)
  let tracking = pickNum('tracking', fallback.tracking)

  // weight：先保证是数字（数字字符串也接受），再吸附到所选字体真实支持的最近档位
  const rawWeight = typeof src.weight === 'string' ? Number(src.weight.trim()) : src.weight
  let weight = finiteNumber(rawWeight) ? clamp(rawWeight, 100, 900) : fallback.weight
  const snapped = snapWeight(family, weight)
  if (snapped !== weight && finiteNumber(rawWeight)) fixes.push(`字重 ${weight} 不被该字体支持，已吸附为 ${snapped}`)
  weight = snapped
  return { value: { family, weight, size, lineHeight, tracking }, fixes }
}

// 消毒整套 levels（方案 / 草稿共用）。fallbackLevels 缺省取瑞士网格
export function sanitizeLevels(raw, fallbackLevels = FONT_COMBOS[0].levels) {
  const src = raw && typeof raw === 'object' ? raw : {}
  const levels = {}
  const fixes = []
  for (const l of LEVELS) {
    const result = sanitizeLevel(src[l.key], fallbackLevels[l.key])
    levels[l.key] = result.value
    for (const f of result.fixes) fixes.push(`${l.label}：${f}`)
  }
  return { levels, fixes }
}

export function sanitizeStageWidth(v) {
  const n = typeof v === 'string' ? Number(v.trim()) : v
  if (!finiteNumber(n)) return DEFAULT_STATE.stageWidth
  return clamp(Math.round(n / 8) * 8, 320, 1040)
}

export function isValidComboId(id) {
  return typeof id === 'string' && FONT_COMBOS.some(c => c.id === id)
}

// 消毒一个从外部读入的方案对象；非法输入返回 null
export function sanitizeScheme(raw) {
  if (!raw || typeof raw !== 'object' || !raw.data || typeof raw.data !== 'object') return null
  const { levels, fixes } = sanitizeLevels(raw.data.levels)
  const name = typeof raw.name === 'string' && raw.name.trim()
    ? raw.name.trim().slice(0, 40)
    : '未命名方案'
  const savedAt = typeof raw.savedAt === 'string' && !Number.isNaN(Date.parse(raw.savedAt))
    ? raw.savedAt
    : new Date().toISOString()
  const comboId = isValidComboId(raw.data.comboId) ? raw.data.comboId : FONT_COMBOS[0].id
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 60) : 'sc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    savedAt,
    imported: true,
    fixes,
    data: { comboId, stageWidth: sanitizeStageWidth(raw.data.stageWidth), levels }
  }
}
