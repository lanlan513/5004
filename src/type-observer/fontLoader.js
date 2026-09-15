// 异步字体加载器
// 原则：文字永远先用 fallback 栈渲染，绝不为了等字体而隐藏文字（不使用 FOIT / 不用 font-display:block）。
// 流程：动态注入 Google Fonts 样式表（display=swap）→ 用 document.fonts.load 逐字体探针 →
//       成功置 ready（浏览器自动无感替换为网络字体），失败 / 超时置 fallback（继续使用栈内系统字体）。

import { FONT_LIBRARY } from './data.js'

const CSS_ID = 'to-google-fonts'
const LOAD_TIMEOUT = 12000 // 单个字体最长等待
const LINK_TIMEOUT = 9000  // 样式表本身最长等待

// idle：尚未开始 | loading：加载中 | ready：网络字体就绪 | fallback：已降级到系统字体
const statuses = {}
const listeners = new Set()
const started = new Set()
let linkState = 'idle'

const CJK_SAMPLE = '排版观察器字体层级'
const LATIN_SAMPLE = 'ABCabc 0123 Typography observer'

function emit() {
  for (const fn of listeners) fn({ ...statuses })
}

export function subscribeFonts(fn) {
  listeners.add(fn)
  fn({ ...statuses })
  return () => listeners.delete(fn)
}

export function getFontStatus(id) {
  return statuses[id] || (FONT_LIBRARY[id]?.system ? 'ready' : 'idle')
}

function setStatus(id, s) {
  if (statuses[id] === s) return
  statuses[id] = s
  emit()
}

function googleHref() {
  const families = Object.values(FONT_LIBRARY)
    .filter(f => f.google && !f.system)
    .map(f => 'family=' + f.google)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

// 注入样式表；返回一个 promise：link onload / onerror / 超时都 resolve（错误只决定是否提前放弃）
let linkPromise
function ensureStylesheet() {
  if (linkPromise) return linkPromise
  linkState = 'loading'
  linkPromise = new Promise(resolve => {
    const existing = document.getElementById(CSS_ID)
    if (existing) { linkState = 'ready'; resolve(true); return }
    const link = document.createElement('link')
    link.id = CSS_ID
    link.rel = 'stylesheet'
    link.href = googleHref()
    let settled = false
    const done = ok => {
      if (settled) return
      settled = true
      linkState = ok ? 'ready' : 'fallback'
      resolve(ok)
    }
    link.addEventListener('load', () => done(true))
    link.addEventListener('error', () => done(false))
    setTimeout(() => done(linkState === 'ready'), LINK_TIMEOUT)
    document.head.appendChild(link)
  })
  return linkPromise
}

function withTimeout(promise, ms, onTimeout) {
  let timer
  return Promise.race([
    promise,
    new Promise(resolve => { timer = setTimeout(() => resolve(onTimeout), ms) })
  ]).finally(() => clearTimeout(timer))
}

// 等待某个具体字体在 document.fonts 中可用
async function probeFont(id) {
  const spec = FONT_LIBRARY[id]
  if (!spec || spec.system) { setStatus(id, 'ready'); return }

  setStatus(id, 'loading')
  const sample = spec.cjk ? CJK_SAMPLE : LATIN_SAMPLE

  // 先等样式表（失败则整体降级）
  const sheetOk = await ensureStylesheet()
  if (!sheetOk) { setStatus(id, 'fallback'); return }

  // 探针：用一个实际会用到的字重请求，触发浏览器拉取对应 unicode-range 分片
  const probeWeight = (() => {
    const w = spec.weights
    return w.type === 'fixed' ? w.values[0] : Math.min(700, w.max)
  })()
  const fontCss = `${probeWeight} 20px ${JSON.stringify(spec.stack.split(',')[0].replace(/'/g, ''))}`

  try {
    await withTimeout(
      document.fonts.load(fontCss, sample).then(() => document.fonts.ready),
      LOAD_TIMEOUT,
      'timeout'
    )
    // document.fonts.ready 只代表当前可见文字所需的字体加载完成，
    // 再用 check 确认目标字体族确实可用
    if (document.fonts.check(fontCss, sample)) {
      setStatus(id, 'ready')
    } else {
      // 分片字体可能仍在加载：短暂轮询确认
      const ok = await recheck(fontCss, sample, 2400)
      setStatus(id, ok ? 'ready' : 'fallback')
    }
  } catch {
    setStatus(id, 'fallback')
  }
}

function recheck(fontCss, sample, budget) {
  return new Promise(resolve => {
    const t0 = Date.now()
    const tick = () => {
      if (document.fonts.check(fontCss, sample)) return resolve(true)
      if (Date.now() - t0 > budget) return resolve(false)
      setTimeout(tick, 200)
    }
    tick()
  })
}

/**
 * 请求加载一组字体（幂等，可重复调用用于重试）。
 * 组件挂载时就应带上初始组合使用的字体；切换组合 / 字体时追加请求。
 */
export function requestFonts(ids = []) {
  for (const id of ids) {
    if (!FONT_LIBRARY[id]) continue
    if (FONT_LIBRARY[id].system) { statuses[id] = 'ready'; continue }
    if (started.has(id) && statuses[id] !== 'fallback') continue
    started.add(id)
    statuses[id] = 'loading'
    // 不阻塞渲染：fire-and-forget，结果通过订阅广播
    probeFont(id)
  }
  emit()
}

// 用户点击「重试」时允许重新发起
export function retryFont(id) {
  started.delete(id)
  requestFonts([id])
}

// 当前使用到的全部字体的汇总状态：ready | fallback | loading
export function summarizeStatus(ids = []) {
  let anyLoading = false
  for (const id of ids) {
    const s = getFontStatus(id)
    if (s === 'fallback') return 'fallback'
    if (s === 'loading' || s === 'idle') anyLoading = true
  }
  return anyLoading ? 'loading' : 'ready'
}
