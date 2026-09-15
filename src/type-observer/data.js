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
