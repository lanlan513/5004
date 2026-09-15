/**
 * 视觉原理互动墙 · 统一实验 Schema
 *
 * 每个实验是一份纯配置，由 Wall.jsx 的 <Experiment> 通用渲染器解释执行。
 * 新增实验 = 新增一份配置，无需改动渲染逻辑。
 *
 * {
 *   id:       唯一标识（同时用作页面锚点）
 *   index:    展示序号，如 '01'
 *   name:     原则中文名
 *   latin:    原则英文名
 *   accent:   强调色（指标条 / 标签 / 辅助线）
 *   stage:    { bg, ink }        舞台底色与前景色
 *   hint:     一句话操作提示
 *   note:     一句话原理说明
 *   control:  {
 *     target: 可拖动元素的 id
 *     axis:   'both' | 'x' | 'scale'   拖动改变什么（位置 / 水平位置 / 大小）
 *     echo:   true 时位移会波浪式传染给所有元素（重复实验）
 *     snap:   { value, tol }           可选，吸附参考线（对齐实验）
 *     min,max: axis 为 scale 时的尺寸范围
 *   },
 *   elements: [ {
 *     id, kind: 'dot' | 'block' | 'text' | 'card',
 *     anchor:   'left' 时按左边缘定位（默认按中心）
 *     cls:      附加 className
 *     base:     原始状态预设 { x, y, s, sy?, r?, fill?, radius? }
 *     modified: 修改状态预设（同上，切换时全部属性平滑过渡）
 *     style:    不随状态变化的样式 { text, weight, color, fill }
 *     card:     kind 为 card 时的文案 { kicker, title, lines, cta }
 *     dynamic:  (props, all) => 样式覆盖   拖动过程中的连续反馈（颜色 / 透明度 / 字重…）
 *   } ],
 *   metric: (els) => { label, value, sub, ratio }      实时指标
 *   guides: (els) => [ { kind:'vline'|'tag'|'box', ... } ]  动态辅助线与标注
 * }
 *
 * 坐标约定：x / y 为舞台宽高的百分比（默认指元素中心点）；
 * s 为相对舞台宽度的尺寸，文字元素的 s 即字号（cqw）。
 */

const clamp01 = v => Math.min(1, Math.max(0, v))

const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]

const lerpColor = (a, b, t) => {
  const ca = hex(a)
  const cb = hex(b)
  const m = ca.map((v, i) => Math.round(v + (cb[i] - v) * clamp01(t)))
  return `rgb(${m[0]}, ${m[1]}, ${m[2]})`
}

/* 亲密性：按距离阈值把点聚成组（并查集） */
const clustersOf = (points, threshold) => {
  const parent = points.map((_, i) => i)
  const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = points[i].x - points[j].x
      const dy = points[i].y - points[j].y
      if (Math.hypot(dx, dy) < threshold) parent[find(i)] = find(j)
    }
  }
  const groups = {}
  points.forEach((p, i) => {
    const root = find(i)
    ;(groups[root] = groups[root] || []).push(p)
  })
  return Object.values(groups)
}

export const experiments = [
  {
    id: 'contrast',
    index: '01',
    name: '对比',
    latin: 'Contrast',
    accent: '#d9ff3f',
    stage: { bg: '#171717', ink: '#f4f1ea' },
    hint: '按住中间的角色上下拖动，改变它的大小',
    note: '差异越大，目光落得越快。',
    control: { target: 'hero', axis: 'scale', min: 5, max: 30 },
    elements: [
      ...[11, 23, 35, 65, 77, 89].map((x, i) => ({
        id: 'sq' + i,
        kind: 'block',
        base: { x, y: 50, s: 7 },
        modified: { x, y: 50, s: 7 },
        style: { fill: '#6f6c66' },
      })),
      {
        id: 'hero',
        kind: 'block',
        base: { x: 50, y: 50, s: 7, radius: 0 },
        modified: { x: 50, y: 50, s: 24, radius: 50 },
        style: {},
        dynamic: p => {
          const t = clamp01((p.s - 7) / 17)
          return { fill: lerpColor('#6f6c66', '#d9ff3f', t), radius: t * 50 }
        },
      },
    ],
    metric: els => {
      const s = els.hero.s
      const w = (s * s) / (s * s + 6 * 7 * 7)
      return {
        label: '视觉重量',
        value: Math.round(w * 100) + '%',
        ratio: w,
        sub: w > 0.45 ? '第一眼 → 中间的主角' : w < 0.12 ? '找不到主角' : '主角若隐若现',
      }
    },
    guides: els => {
      const s = els.hero.s
      const w = (s * s) / (s * s + 6 * 7 * 7)
      return w > 0.45 ? [{ kind: 'tag', x: 50, y: els.hero.y - s / 2 - 6, text: '第一眼' }] : []
    },
  },

  {
    id: 'repetition',
    index: '02',
    name: '重复',
    latin: 'Repetition',
    accent: '#ff5938',
    stage: { bg: '#fff8ef', ink: '#171717' },
    hint: '拖动第一颗，整队都会跟上',
    note: '相同的形状排成队，移动就有了节奏。',
    control: { target: 'e0', axis: 'both', echo: true },
    elements: [
      { id: 'e0', kind: 'block', base: { x: 14, y: 50, s: 9, r: 0, fill: '#ff5938', radius: 0 }, modified: { x: 14, y: 50, s: 9, r: 0, fill: '#171717', radius: 50 }, style: {} },
      { id: 'e1', kind: 'block', base: { x: 26.8, y: 50, s: 7.5, r: 14, fill: '#171717', radius: 50 }, modified: { x: 26.8, y: 50, s: 9, r: 0, fill: '#171717', radius: 50 }, style: {} },
      { id: 'e2', kind: 'block', base: { x: 39.6, y: 50, s: 10, r: -9, fill: '#a8a49b', radius: 0 }, modified: { x: 39.6, y: 50, s: 9, r: 0, fill: '#171717', radius: 50 }, style: {} },
      { id: 'e3', kind: 'block', base: { x: 52.4, y: 50, s: 8, r: 45, fill: '#6ac4d7', radius: 0 }, modified: { x: 52.4, y: 50, s: 9, r: 0, fill: '#171717', radius: 50 }, style: {} },
      { id: 'e4', kind: 'block', base: { x: 65.2, y: 50, s: 9, r: -20, fill: '#7546e8', radius: 14 }, modified: { x: 65.2, y: 50, s: 9, r: 0, fill: '#171717', radius: 50 }, style: {} },
      { id: 'e5', kind: 'block', base: { x: 78, y: 50, s: 7, r: 7, fill: '#c9c4b8', radius: 50 }, modified: { x: 78, y: 50, s: 9, r: 0, fill: '#171717', radius: 50 }, style: {} },
    ],
    metric: els => {
      const sigs = Object.values(els).map(p => `${p.fill}|${p.radius}|${p.r}`)
      const counts = {}
      sigs.forEach(s => { counts[s] = (counts[s] || 0) + 1 })
      const u = Math.max(...Object.values(counts)) / sigs.length
      return {
        label: '统一度',
        value: Math.round(u * 100) + '%',
        ratio: u,
        sub: u === 1 ? '一个队伍，一种节奏' : u >= 0.5 ? '开始像一家人' : '各自为政',
      }
    },
  },

  {
    id: 'alignment',
    index: '03',
    name: '对齐',
    latin: 'Alignment',
    accent: '#6ac4d7',
    stage: { bg: '#171717', ink: '#f4f1ea' },
    hint: '左右拖动亮色的那一行',
    note: '对齐不是摆整齐，是画出一条隐形的线。',
    control: { target: 'l2', axis: 'x', snap: { value: 22, tol: 3 } },
    elements: [
      { id: 'l1', kind: 'text', anchor: 'left', base: { x: 22, y: 24, s: 4.6 }, modified: { x: 22, y: 24, s: 4.6 }, style: { text: '构图 · Composition', weight: 700 } },
      { id: 'l2', kind: 'text', anchor: 'left', base: { x: 33, y: 41, s: 4.6 }, modified: { x: 22, y: 41, s: 4.6 }, style: { text: '色彩 · Color', weight: 700, color: '#6ac4d7' } },
      { id: 'l3', kind: 'text', anchor: 'left', base: { x: 17, y: 58, s: 4.6 }, modified: { x: 22, y: 58, s: 4.6 }, style: { text: '字体 · Type', weight: 700 } },
      { id: 'l4', kind: 'text', anchor: 'left', base: { x: 38, y: 75, s: 4.6 }, modified: { x: 22, y: 75, s: 4.6 }, style: { text: '层级 · Hierarchy', weight: 700 } },
    ],
    metric: els => {
      const n = Object.values(els).filter(p => Math.abs(p.x - 22) < 0.5).length
      return {
        label: '对齐',
        value: n + ' / 4',
        ratio: n / 4,
        sub: n === 4 ? '一条隐形的线出现了' : n >= 2 ? '线正在形成' : '视线找不到落点',
      }
    },
    guides: els => {
      const n = Object.values(els).filter(p => Math.abs(p.x - 22) < 0.5).length
      const snapped = Math.abs(els.l2.x - 22) < 0.5
      return [
        { kind: 'vline', x: 22, active: n > 1 },
        ...(snapped ? [{ kind: 'tag', x: 64, y: els.l2.y, text: '✓ 对齐' }] : []),
      ]
    },
  },

  {
    id: 'whitespace',
    index: '04',
    name: '留白',
    latin: 'Whitespace',
    accent: '#7546e8',
    stage: { bg: '#fff8ef', ink: '#171717' },
    hint: '按住内容上下拖动，给它一点呼吸',
    note: '留白不是空白，是给想法呼吸的地方。',
    control: { target: 'card', axis: 'scale', min: 22, max: 52 },
    elements: [
      { id: 'frame', kind: 'block', cls: 'xp-frame', base: { x: 50, y: 50, s: 64, sy: 84 }, modified: { x: 50, y: 50, s: 64, sy: 84 }, style: { color: '#171717' } },
      {
        id: 'card',
        kind: 'card',
        base: { x: 50, y: 50, s: 50 },
        modified: { x: 50, y: 50, s: 36 },
        style: {},
        card: { kicker: 'STUDIO 14 · 海报 001', title: '留白不是空白', lines: ['是给想法呼吸的地方'], cta: '了解更多 →' },
      },
    ],
    metric: els => {
      const s = els.card.s
      const free = 1 - (s * s * 1.6667) / (64 * 84)
      const pct = Math.round(free * 100)
      return {
        label: '留白率',
        value: pct + '%',
        ratio: clamp01(free),
        sub: pct < 35 ? '拥挤，内容快溢出来了' : pct <= 60 ? '刚好，内容与空间平衡' : '从容，空间也在说话',
      }
    },
    guides: els => [
      { kind: 'tag', x: 18, y: 8, text: '画面', tone: 'ghost' },
      { kind: 'tag', x: 50, y: 50 - els.card.s * 0.833 + 5.5, text: '内容区', tone: 'ghost' },
    ],
  },

  {
    id: 'proximity',
    index: '05',
    name: '亲密性',
    latin: 'Proximity',
    accent: '#ffcf3b',
    stage: { bg: '#171717', ink: '#f4f1ea' },
    hint: '拖动黄色的那颗，靠近谁，就和谁成为一组',
    note: '距离，是眼睛判断关系的捷径。',
    control: { target: 'd0', axis: 'both' },
    elements: [
      { id: 'd0', kind: 'dot', base: { x: 50, y: 34, s: 5.5 }, modified: { x: 40, y: 42, s: 5.5 }, style: { fill: '#ffcf3b' } },
      { id: 'd1', kind: 'dot', base: { x: 30, y: 34, s: 5.5 }, modified: { x: 32, y: 38, s: 5.5 }, style: { fill: '#f4f1ea' } },
      { id: 'd2', kind: 'dot', base: { x: 70, y: 34, s: 5.5 }, modified: { x: 35, y: 51, s: 5.5 }, style: { fill: '#f4f1ea' } },
      { id: 'd3', kind: 'dot', base: { x: 30, y: 66, s: 5.5 }, modified: { x: 61, y: 52, s: 5.5 }, style: { fill: '#f4f1ea' } },
      { id: 'd4', kind: 'dot', base: { x: 50, y: 66, s: 5.5 }, modified: { x: 69, y: 58, s: 5.5 }, style: { fill: '#f4f1ea' } },
      { id: 'd5', kind: 'dot', base: { x: 70, y: 66, s: 5.5 }, modified: { x: 63, y: 66, s: 5.5 }, style: { fill: '#f4f1ea' } },
    ],
    metric: els => {
      const pts = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'].map(id => els[id])
      const groups = clustersOf(pts, 15).filter(g => g.length >= 2)
      const grouped = groups.reduce((n, g) => n + g.length, 0)
      const singles = pts.length - grouped
      return {
        label: '分组',
        value: groups.length + ' 组',
        ratio: grouped / pts.length,
        sub: groups.length === 0 ? '每颗都一样远，看不出关系' : singles ? singles + ' 颗落单' : '没有落单',
      }
    },
    guides: els => {
      const pts = ['d0', 'd1', 'd2', 'd3', 'd4', 'd5'].map(id => els[id])
      return clustersOf(pts, 15)
        .filter(g => g.length >= 2)
        .map((g, i) => {
          const xs = g.map(p => p.x)
          const ys = g.map(p => p.y)
          return {
            kind: 'box',
            x: Math.min(...xs) - 7,
            y: Math.min(...ys) - 8,
            w: Math.max(...xs) - Math.min(...xs) + 14,
            h: Math.max(...ys) - Math.min(...ys) + 16,
            label: '第 ' + (i + 1) + ' 组',
          }
        })
    },
  },

  {
    id: 'hierarchy',
    index: '06',
    name: '层级',
    latin: 'Hierarchy',
    accent: '#63d9ca',
    stage: { bg: '#fff8ef', ink: '#171717' },
    hint: '按住标题上下拖动，拉开三行的差距',
    note: '好版式会替读者决定先读哪一行。',
    control: { target: 't1', axis: 'scale', min: 4, max: 11 },
    elements: [
      {
        id: 't1', kind: 'text',
        base: { x: 50, y: 30, s: 5 }, modified: { x: 50, y: 30, s: 10 },
        style: { text: '让重要的事先被看见' },
        dynamic: p => ({ weight: 600 + Math.round(clamp01((p.s - 5) / 5) * 2) * 100 }),
      },
      {
        id: 't2', kind: 'text',
        base: { x: 50, y: 52, s: 5 }, modified: { x: 50, y: 50, s: 4.2 },
        style: { text: '副标题 · 给眼睛一个落点' },
        dynamic: (p, all) => ({ opacity: 1 - clamp01((all.t1.s - 5) / 5) * 0.25 }),
      },
      {
        id: 't3', kind: 'text',
        base: { x: 50, y: 74, s: 5 }, modified: { x: 50, y: 70, s: 2.8 },
        style: { text: '正文 — 细节安静地等待被阅读' },
        dynamic: (p, all) => ({ opacity: 1 - clamp01((all.t1.s - 5) / 5) * 0.5 }),
      },
    ],
    metric: els => {
      const r = els.t1.s / els.t3.s
      return {
        label: '层级差',
        value: '×' + r.toFixed(1),
        ratio: clamp01((r - 1) / 2.4),
        sub: r < 1.4 ? '三条一样重，目光无处安放' : r < 2 ? '层级开始出现' : '阅读顺序 1 → 2 → 3',
      }
    },
    guides: els => {
      const r = els.t1.s / els.t3.s
      if (r < 1.8) return []
      return [['1', els.t1.y], ['2', els.t2.y], ['3', els.t3.y]].map(([t, y]) => ({ kind: 'tag', x: 16, y, text: t }))
    },
  },
]
