import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  LEVELS, FONT_LIBRARY, FONT_GROUPS, FONT_COMBOS, WEIGHT_LABELS,
  DEFAULT_STATE, SAMPLE_SENTENCES, STORAGE_SCHEMES, STORAGE_DRAFT, snapWeight,
  LIMITS, TEXT_LIMIT, SENTENCE_LIMIT,
  sanitizeLevels, sanitizeStageWidth, isValidComboId, sanitizeScheme
} from './data.js'
import { subscribeFonts, requestFonts, retryFont, summarizeStatus } from './fontLoader.js'
import './styles.css'

/* ------------------------------- 本地存储 ------------------------------- */

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function initialState() {
  const draft = loadJSON(STORAGE_DRAFT, null)
  if (draft && typeof draft === 'object' && draft.levels) {
    // 草稿可能来自旧版本或被手改过：合并默认值后统一消毒，缺字段 / 非法字体都不会白屏。
    // 文字只做类型校验、原样保留完整内容，绝不静默截断（超过输入上限的旧草稿在界面上显式提示）。
    const { levels } = sanitizeLevels(draft.levels)
    const texts = Object.fromEntries(LEVELS.map(l => [
      l.key,
      typeof draft.texts?.[l.key] === 'string' ? draft.texts[l.key] : DEFAULT_STATE.texts[l.key]
    ]))
    return {
      ...DEFAULT_STATE,
      comboId: isValidComboId(draft.comboId) ? draft.comboId : DEFAULT_STATE.comboId,
      activeLevel: LEVELS.some(l => l.key === draft.activeLevel) ? draft.activeLevel : 'title',
      stageWidth: sanitizeStageWidth(draft.stageWidth),
      gridOn: draft.gridOn === true,
      texts,
      overLimit: LEVELS.some(l => texts[l.key].length > TEXT_LIMIT),
      levels
    }
  }
  return structuredClone(DEFAULT_STATE)
}

// 读取已保存方案：逐条消毒，并把清洗后的结果写回，损坏条目被丢弃而不是拖垮整页
function loadSchemes() {
  const list = loadJSON(STORAGE_SCHEMES, [])
  if (!Array.isArray(list)) return []
  const clean = list.map(sanitizeScheme).filter(Boolean)
  return clean
}

/* ------------------------------- 文字测量 ------------------------------- */

let measureCanvas = null
function tokenize(text) {
  const tokens = []
  let word = ''
  const flush = () => { if (word) { tokens.push({ t: 'word', v: word }); word = '' } }
  for (const ch of text) {
    if (/[㐀-鿿豈-﫿]/.test(ch)) { flush(); tokens.push({ t: 'cjk', v: ch }) }
    else if (/\s/.test(ch)) { flush(); tokens.push({ t: 'space', v: ch }) }
    else word += ch
  }
  flush()
  return tokens
}

// 返回 { lines, paragraphs, charsPerLine }，用于右侧观察数据
function measureBlock(text, cfg, widthPx) {
  if (!measureCanvas) measureCanvas = document.createElement('canvas')
  const ctx = measureCanvas.getContext('2d')
  ctx.font = `${cfg.weight} ${cfg.size}px ${fontSpec(cfg.family).stack}`
  const trackPx = cfg.size * cfg.tracking
  const widthOf = str => ctx.measureText(str).width + Math.max(0, trackPx) * Math.max(0, [...str].length - 1)
  const paragraphs = String(text || '').split('\n')
  let lines = 0
  let maxChars = 0
  for (const para of paragraphs) {
    if (!para) { lines += 1; continue }
    let lineW = 0
    let lineChars = 0
    for (const tk of tokenize(para)) {
      if (tk.t === 'space' && lineW === 0) continue // 行首空白吞掉
      const w = widthOf(tk.v)
      if (lineW + w > widthPx && lineW > 0) {
        lines += 1
        maxChars = Math.max(maxChars, lineChars)
        if (tk.t === 'space') { lineW = 0; lineChars = 0; continue }
        lineW = w + Math.max(0, trackPx); lineChars = tk.v.length
      } else {
        lineW += w
        lineChars += tk.v.length
      }
    }
    lines += 1
    maxChars = Math.max(maxChars, lineChars)
  }
  return { lines: Math.max(1, lines), paragraphs: paragraphs.length, charsPerLine: maxChars }
}

// 渲染兜底：万一 state 中出现未知字体 ID，也绝不让 .stack 取值抛错白屏
const FALLBACK_FONT = FONT_LIBRARY.systemSans
function fontSpec(id) {
  return FONT_LIBRARY[id] || FALLBACK_FONT
}

/* ------------------------------- 错误边界 ------------------------------- */

class TypeErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error) { console.error('[type-observer] render error:', error) }
  reset = () => {
    try {
      localStorage.removeItem(STORAGE_DRAFT)
      localStorage.removeItem(STORAGE_SCHEMES)
    } catch { /* ignore */ }
    this.setState({ error: null })
    window.location.reload()
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f1ea', padding: 24, fontFamily: 'system-ui,sans-serif' }}>
        <div style={{ maxWidth: 460, border: '1px solid #171717', borderRadius: 12, background: '#fffaf1', padding: 28 }}>
          <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: '.12em', color: '#ff5938', margin: '0 0 10px' }}>TYPE OBSERVER · RECOVERY</p>
          <h2 style={{ fontSize: 22, margin: '0 0 10px' }}>排版数据无法渲染，已保护当前页面</h2>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: '#6b6861', margin: '0 0 18px' }}>
            本地保存的草稿或方案包含无法识别的数据。清除本地数据并刷新即可恢复，内置的默认排版方案不会丢失。
          </p>
          <button onClick={this.reset} style={{ background: '#171717', color: '#f4f1ea', borderRadius: 100, padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>
            清除本地数据并重载
          </button>
        </div>
      </div>
    )
  }
}

export default function TypeObserver(props) {
  return (
    <TypeErrorBoundary>
      <TypeObserverInner {...props} />
    </TypeErrorBoundary>
  )
}

/* ------------------------------- 主组件 ------------------------------- */

const SLIDERS = [
  { key: 'size', label: '字号', min: 10, max: 96, step: 1, fmt: v => `${v}px` },
  { key: 'weight', label: '字重', min: 100, max: 900, step: 100, fmt: v => `${v} · ${WEIGHT_LABELS[v] || ''}` },
  { key: 'lineHeight', label: '行距', min: 1, max: 2.4, step: 0.05, fmt: v => `${v.toFixed(2)} ×` },
  { key: 'tracking', label: '字距', min: -0.05, max: 0.5, step: 0.01, fmt: v => `${Math.round(v * 1000) / 10}‰ em` }
]

function TypeObserverInner({ go }) {
  const [state, setState] = useState(initialState)
  const [fontStatus, setFontStatus] = useState({})
  const [schemes, setSchemes] = useState(loadSchemes)
  const [modalOpen, setModalOpen] = useState(false)
  const [schemeName, setSchemeName] = useState('')
  const [toast, setToast] = useState('')
  const [sentence, setSentence] = useState(SAMPLE_SENTENCES[0])
  const fileRef = useRef(null)
  const toastTimer = useRef(null)

  const active = state.activeLevel
  const activeCfg = state.levels[active]
  const usedFamilies = useMemo(
    () => [...new Set(LEVELS.map(l => state.levels[l.key].family))],
    [state.levels]
  )

  const showToast = msg => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2400)
  }

  /* 字体：订阅状态 + 按当前使用情况发起异步请求 */
  useEffect(() => subscribeFonts(setFontStatus), [])
  const familiesKey = usedFamilies.join(',')
  useEffect(() => { requestFonts(familiesKey.split(',')) }, [familiesKey])

  /* 草稿自动保存（防抖） */
  useEffect(() => {
    const t = setTimeout(() => {
      try { localStorage.setItem(STORAGE_DRAFT, JSON.stringify(state)) } catch { /* 存储满时静默 */ }
    }, 400)
    return () => clearTimeout(t)
  }, [state])

  /* Cmd/Ctrl + S 保存方案 */
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        setModalOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const patchLevel = (patch, levelKey = active) =>
    setState(s => ({ ...s, levels: { ...s.levels, [levelKey]: { ...s.levels[levelKey], ...patch } } }))

  const changeFamily = family => {
    if (!FONT_LIBRARY[family]) {
      showToast(`字体「${family}」不存在，已忽略`)
      return
    }
    setState(s => {
      const cur = s.levels[active]
      const weight = snapWeight(family, cur.weight)
      if (weight !== cur.weight) setTimeout(() => showToast(`该字体不支持 ${cur.weight}，已吸附为 ${weight}`), 0)
      return { ...s, levels: { ...s.levels, [active]: { ...cur, family, weight } } }
    })
    requestFonts([family])
  }

  // 字重滑杆专用：范围 / 步进完全取自字体元数据，拖动中即吸附到最近支持档位
  const weightSpec = fontSpec(activeCfg.family).weights
  const weightIsFixed = weightSpec.type === 'fixed'
  const weightMin = weightIsFixed ? weightSpec.values[0] : weightSpec.min
  const weightMax = weightIsFixed ? weightSpec.values[weightSpec.values.length - 1] : weightSpec.max
  const weightStep = weightIsFixed ? 1 : weightSpec.step
  const weightStops = weightIsFixed ? weightSpec.values : null
  const onWeightInput = raw => {
    const weight = snapWeight(activeCfg.family, Number(raw))
    if (weight !== activeCfg.weight) patchLevel({ weight })
  }

  const applyCombo = combo => {
    setState(s => ({ ...s, comboId: combo.id, levels: structuredClone(combo.levels) }))
    requestFonts(LEVELS.map(l => combo.levels[l.key].family))
    showToast(`已应用组合「${combo.name}」`)
  }

  const resetToCombo = () => {
    const combo = FONT_COMBOS.find(c => c.id === state.comboId) || FONT_COMBOS[0]
    setState(s => ({ ...s, levels: structuredClone(combo.levels) }))
    showToast(`已恢复「${combo.name}」推荐参数`)
  }

  const fillSentence = () => {
    const s = sentence.trim()
    if (!s) return
    const texts = { title: s, body: `${s}　${s}　再调整参数，观察三个层级如何一起呼吸。`, note: `QUOTED ·「${s}」` }
    setState(st => ({
      ...st,
      texts,
      overLimit: LEVELS.some(l => texts[l.key].length > TEXT_LIMIT)
    }))
    showToast('一句话已填入三个层级')
  }

  const isCustomized = combo =>
    LEVELS.some(l => {
      const a = state.levels[l.key]
      const b = combo.levels[l.key]
      return a.family !== b.family || a.weight !== b.weight ||
        Math.abs(a.size - b.size) > 0.01 ||
        Math.abs(a.lineHeight - b.lineHeight) > 0.001 ||
        Math.abs(a.tracking - b.tracking) > 0.0001
    })

  /* 方案保存 / 应用 / 删除 / 导入导出 */
  const persistSchemes = list => {
    setSchemes(list)
    try { localStorage.setItem(STORAGE_SCHEMES, JSON.stringify(list)) } catch { showToast('本地存储不可用') }
  }
  const saveScheme = () => {
    const name = schemeName.trim() || `方案 ${schemes.length + 1}`
    const scheme = {
      id: 'sc_' + Date.now().toString(36),
      name,
      savedAt: new Date().toISOString(),
      data: {
        comboId: state.comboId,
        stageWidth: state.stageWidth,
        levels: structuredClone(state.levels)
      }
    }
    persistSchemes([scheme, ...schemes])
    setModalOpen(false)
    setSchemeName('')
    showToast(`排版方案「${name}」已保存`)
  }
  const applyScheme = scheme => {
    const d = scheme?.data
    if (!d) { showToast('方案数据损坏，无法载入'); return }
    // 载入时再次消毒：无论数据来自本地还是导入，非法字体 / 数值都会被安全替换
    const { levels, fixes } = sanitizeLevels(d.levels, state.levels)
    setState(s => ({
      ...s,
      comboId: isValidComboId(d.comboId) ? d.comboId : s.comboId,
      stageWidth: d.stageWidth ? sanitizeStageWidth(d.stageWidth) : s.stageWidth,
      levels
    }))
    requestFonts(LEVELS.map(l => levels[l.key].family))
    showToast(fixes.length
      ? `已载入方案「${scheme.name}」，${fixes.length} 处参数已自动修正`
      : `已载入方案「${scheme.name}」`)
  }
  const deleteScheme = id => persistSchemes(schemes.filter(s => s.id !== id))

  const exportSchemes = () => {
    const payload = schemes.map(({ id, name, savedAt, data }) => ({ id, name, savedAt, data }))
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `type-schemes-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const importSchemes = e => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const rawList = Array.isArray(parsed) ? parsed : [parsed]
        const clean = rawList.map(sanitizeScheme).filter(Boolean)
        if (!clean.length) throw new Error('empty')
        persistSchemes([...clean, ...schemes])
        const fixed = clean.reduce((n, s) => n + (s.fixes?.length || 0), 0)
        showToast(fixed
          ? `已导入 ${clean.length} 个方案，${fixed} 处非法参数已自动修正（未知字体回退默认）`
          : `已导入 ${clean.length} 个方案`)
      } catch { showToast('文件不是有效的排版方案') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const overallStatus = summarizeStatus(usedFamilies)
  const chipText = { loading: '字体异步加载中…（当前显示备用字体）', ready: '网络字体已就绪', fallback: '部分字体不可用 · 已切换备用字体' }[overallStatus]

  // 层级文字更新：界面层用 maxLength 约束新输入；同时保留对超长内容的显式标记，
  // 这样旧草稿恢复的完整长文本能被看到、能删减，而不是被悄悄切断。
  const setLevelText = (levelKey, value) =>
    setState(s => ({
      ...s,
      texts: { ...s.texts, [levelKey]: value },
      overLimit: LEVELS.some(l => (l.key === levelKey ? value : s.texts[l.key]).length > TEXT_LIMIT)
    }))

  const paperPadX = 56
  const contentWidth = Math.max(200, state.stageWidth - paperPadX * 2)

  return (
    <div className="to-app">
      {/* 顶栏 */}
      <header className="to-topbar">
        <div className="to-topbar-left">
          <button className="to-back" onClick={() => go('/')}>← STUDIO 14</button>
          <span className="to-divider" />
          <div className="to-brand">
            <strong>文字观察器</strong>
            <span>TYPE OBSERVER</span>
          </div>
        </div>
        <div className={`to-font-chip to-chip-${overallStatus}`} title="字体加载状态">
          <span className="to-chip-dot" />
          {chipText}
        </div>
        <div className="to-topbar-right">
          <button className="to-btn-ghost" onClick={resetToCombo}>重置参数</button>
          <button className="to-btn-primary" onClick={() => setModalOpen(true)}>＋ 保存排版方案</button>
        </div>
      </header>

      <div className="to-workspace">
        {/* ---------------- 左栏：输入 / 组合 / 参数 / 方案 ---------------- */}
        <aside className="to-panel to-left">
          <section className="to-card">
            <h3><span className="to-num">01</span> 输入文字</h3>
            <label className="to-field-label">一句话实验</label>
            <div className="to-sentence-row">
              <input
                value={sentence}
                maxLength={SENTENCE_LIMIT}
                onChange={e => setSentence(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fillSentence()}
                placeholder="输入任意一句话…"
              />
              <button className="to-btn-dark" onClick={fillSentence}>填入三层</button>
            </div>
            {state.overLimit && (
              <p className="to-limit-warn" role="alert">
                历史草稿中的文字超过 {TEXT_LIMIT} 字上限，已为你完整保留；删减到上限内后才能继续输入新内容。
              </p>
            )}
            <div className="to-samples">
              {SAMPLE_SENTENCES.map(s => (
                <button key={s} className="to-sample" onClick={() => setSentence(s)}>{s}</button>
              ))}
            </div>
            <div className="to-level-inputs">
              {LEVELS.map(l => {
                const len = state.texts[l.key].length
                const over = len > TEXT_LIMIT
                return (
                  <div key={l.key} className="to-level-input">
                    <div className="to-level-input-head">
                      <span className={`to-tag to-tag-${l.key}`}>{l.label}</span>
                      <span className={`to-counter ${over ? 'to-counter-over' : ''}`}>{len} / {TEXT_LIMIT}</span>
                    </div>
                    <textarea
                      rows={l.key === 'body' ? 3 : 1}
                      value={state.texts[l.key]}
                      maxLength={over ? undefined : TEXT_LIMIT}
                      aria-invalid={over}
                      onChange={e => setLevelText(l.key, e.target.value)}
                      placeholder={`${l.label}文字…`}
                    />
                  </div>
                )
              })}
            </div>
          </section>

          <section className="to-card">
            <h3><span className="to-num">02</span> 字体组合（含设计场景）</h3>
            <div className="to-combos">
              {FONT_COMBOS.map(combo => {
                const titleSpec = FONT_LIBRARY[combo.levels.title.family]
                const activeCombo = state.comboId === combo.id
                return (
                  <div
                    key={combo.id}
                    className={`to-combo ${activeCombo ? 'to-combo-active' : ''} ${isCustomized(combo) ? 'to-combo-mod' : ''}`}
                  >
                    <div className="to-combo-head">
                      <div className="to-combo-sample" style={{ fontFamily: titleSpec.stack, fontWeight: combo.levels.title.weight }}>
                        <span className="to-combo-aa">Aa永</span>
                        <span className="to-combo-meta">{combo.en}</span>
                      </div>
                      <button className="to-apply" onClick={() => applyCombo(combo)}>
                        {activeCombo ? '使用中' : '应用'}
                      </button>
                    </div>
                    <strong className="to-combo-name">{combo.name}</strong>
                    <p className="to-combo-desc">{combo.desc}</p>
                    <div className="to-scenes">
                      {combo.scenes.map(sc => <span key={sc}>{sc}</span>)}
                    </div>
                    <div className="to-combo-spec">
                      {LEVELS.map(l => (
                        <span key={l.key}>
                          <i className={`to-tag to-tag-${l.key}`}>{l.label}</i>
                          {FONT_LIBRARY[combo.levels[l.key].family].label} · {combo.levels[l.key].size}px
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="to-card">
            <h3><span className="to-num">03</span> 排版参数</h3>
            <div className="to-tabs">
              {LEVELS.map(l => (
                <button
                  key={l.key}
                  className={active === l.key ? 'to-tab to-tab-on' : 'to-tab'}
                  onClick={() => setState(s => ({ ...s, activeLevel: l.key }))}
                >
                  <i className={`to-tag to-tag-${l.key}`}>{l.label}</i>
                  {fontSpec(state.levels[l.key].family).label.split(' ')[0]}
                </button>
              ))}
            </div>

            <label className="to-field-label">字体（{fontSpec(activeCfg.family).label}）</label>
            <select className="to-select" value={activeCfg.family} onChange={e => changeFamily(e.target.value)}>
              {FONT_GROUPS.map(g => (
                <optgroup key={g.group} label={g.group}>
                  {g.ids.map(id => (
                    <option key={id} value={id}>{FONT_LIBRARY[id].label}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {SLIDERS.map(sl => {
              const spec = fontSpec(activeCfg.family)
              const fixedSingle = sl.key === 'weight' && spec.weights.type === 'fixed' && spec.weights.values.length === 1
              // 字重滑块的可选范围严格限定为该字体真实支持的档位
              const isWeight = sl.key === 'weight'
              const min = isWeight ? weightMin : sl.min
              const max = isWeight ? weightMax : sl.max
              const step = isWeight ? weightStep : sl.step
              const showStops = isWeight && weightStops && !fixedSingle
              return (
                <div className="to-slider" key={sl.key} data-disabled={fixedSingle}>
                  <div className="to-slider-head">
                    <span>{sl.label}{isWeight && weightIsFixed && !fixedSingle && <em className="to-slider-note">该字体仅提供离散档位</em>}</span>
                    <b>{fixedSingle ? `仅 ${activeCfg.weight}（${WEIGHT_LABELS[activeCfg.weight]}）` : sl.fmt(activeCfg[sl.key])}</b>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={activeCfg[sl.key]}
                    disabled={fixedSingle}
                    onChange={e => isWeight
                      ? onWeightInput(e.target.value)
                      : patchLevel({ [sl.key]: Number(e.target.value) })}
                  />
                  {showStops && (
                    <div className="to-weight-stops">
                      {weightStops.map(w => (
                        <button
                          key={w}
                          className={w === activeCfg.weight ? 'on' : ''}
                          title={WEIGHT_LABELS[w]}
                          onClick={() => patchLevel({ weight: w })}
                        >{w}</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </section>

          <section className="to-card">
            <h3>
              <span className="to-num">04</span> 已保存方案
              <span className="to-card-count">{schemes.length}</span>
            </h3>
            {schemes.length === 0 && <p className="to-empty">还没有方案。调好一组参数后点击右上角「保存排版方案」（支持 ⌘/Ctrl + S）。</p>}
            <div className="to-scheme-list">
              {schemes.map(sc => (
                <div key={sc.id} className="to-scheme">
                  <button className="to-scheme-main" onClick={() => applyScheme(sc)}>
                    <b>{sc.name}</b>
                    <span>
                      {(FONT_COMBOS.find(c => c.id === sc.data.comboId)?.name) || '自定义'} ·{' '}
                      {new Date(sc.savedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                    </span>
                  </button>
                  <button className="to-scheme-del" title="删除" onClick={() => deleteScheme(sc.id)}>×</button>
                </div>
              ))}
            </div>
            {schemes.length > 0 && (
              <div className="to-io">
                <button onClick={exportSchemes}>导出 JSON</button>
                <button onClick={() => fileRef.current?.click()}>导入 JSON</button>
                <input ref={fileRef} type="file" accept="application/json" hidden onChange={importSchemes} />
              </div>
            )}
          </section>
        </aside>

        {/* ---------------- 中栏：预览舞台 ---------------- */}
        <main className="to-stage-wrap">
          <div className="to-stage-bar">
            <div className="to-stage-toggles">
              <button className={state.gridOn ? 'to-toggle on' : 'to-toggle'} onClick={() => setState(s => ({ ...s, gridOn: !s.gridOn }))}>
                基线网格
              </button>
              <span className="to-stage-hint">点击右侧任意文字块可切换正在编辑的层级</span>
            </div>
            <label className="to-width-ctl">
              版心 {state.stageWidth}px
              <input
                type="range" min={320} max={1040} step={8}
                value={state.stageWidth}
                onChange={e => setState(s => ({ ...s, stageWidth: Number(e.target.value) }))}
              />
            </label>
          </div>

          <div className="to-stage-scroll">
            <div
              className={`to-paper ${state.gridOn ? 'to-grid-on' : ''}`}
              style={{ width: state.stageWidth }}
              onClick={e => {
                const block = e.target.closest('[data-level]')
                if (block) setState(s => ({ ...s, activeLevel: block.dataset.level }))
              }}
            >
              {LEVELS.map(l => {
                const cfg = state.levels[l.key]
                const spec = fontSpec(cfg.family)
                return (
                  <div
                    key={l.key}
                    data-level={l.key}
                    className={`to-block to-block-${l.key} ${active === l.key ? 'to-block-active' : ''}`}
                  >
                    <span className={`to-block-tag to-tag to-tag-${l.key}`}>
                      {l.en} · {spec.label.split(' ')[0]} · {cfg.size}px / {cfg.weight}
                    </span>
                    <div
                      className="to-block-text"
                      style={{
                        fontFamily: spec.stack,
                        fontSize: cfg.size,
                        fontWeight: cfg.weight,
                        lineHeight: cfg.lineHeight,
                        letterSpacing: `${cfg.tracking}em`,
                        '--lh': cfg.lineHeight
                      }}
                    >
                      {state.texts[l.key] || <span className="to-ph">（此处为空，去左栏输入{l.label}文字）</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </main>

        {/* ---------------- 右栏：观察数据 + 字体状态 ---------------- */}
        <aside className="to-panel to-right">
          <section className="to-card">
            <h3>层级观察</h3>
            <p className="to-tip">同样的字体参数变化会在三个层级产生不同结果——层级就是这样被组织出来的。</p>
            {LEVELS.map(l => {
              const cfg = state.levels[l.key]
              const m = measureBlock(state.texts[l.key], cfg, contentWidth)
              return (
                <div key={l.key} className={`to-metric ${active === l.key ? 'to-metric-on' : ''}`}>
                  <div className="to-metric-head">
                    <i className={`to-tag to-tag-${l.key}`}>{l.label}</i>
                    <span className={`to-font-dot to-dot-${fontStatus[cfg.family] || 'idle'}`} title={fontStatus[cfg.family] || 'idle'} />
                  </div>
                  <dl>
                    <div><dt>字号 / 行高</dt><dd>{cfg.size}px · {Math.round(cfg.size * cfg.lineHeight)}px</dd></div>
                    <div><dt>字重 / 字距</dt><dd>{cfg.weight} · {Math.round(cfg.tracking * 1000) / 10}‰</dd></div>
                    <div><dt>行数 × 段落</dt><dd>{m.lines} × {m.paragraphs}</dd></div>
                    <div><dt>每行约容纳</dt><dd>{m.charsPerLine} 字符</dd></div>
                  </dl>
                  <div className="to-bar">
                    <i style={{ width: `${Math.min(100, cfg.size / 96 * 100)}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="to-scale-ratio">
              标题 : 正文 : 注释 =
              <b>{(state.levels.title.size / state.levels.body.size).toFixed(2)}</b> :
              <b>1</b> :
              <b>{(state.levels.note.size / state.levels.body.size).toFixed(2)}</b>
            </div>
          </section>

          <section className="to-card">
            <h3>字体加载状态</h3>
            <p className="to-tip">
              文字先用备用字体立即渲染，网络字体到达后无感替换；超时或离线时保持备用字体，<b>任何情况下都不会白屏</b>。
            </p>
            <div className="to-status-list">
              {usedFamilies.map(id => {
                const st = fontStatus[id] || 'idle'
                const spec = FONT_LIBRARY[id]
                return (
                  <div key={id} className="to-status-row">
                    <span className={`to-font-dot to-dot-${st}`} />
                    <span className="to-status-name">{spec.label}</span>
                    <span className="to-status-state">
                      {st === 'ready' ? '已就绪' : st === 'loading' ? '加载中' : st === 'fallback' ? '备用字体' : '等待中'}
                    </span>
                    {st === 'fallback' && <button className="to-retry" onClick={() => retryFont(id)}>重试</button>}
                  </div>
                )
              })}
            </div>
          </section>
        </aside>
      </div>

      {/* 保存弹窗 */}
      {modalOpen && (
        <div className="to-modal-mask" onMouseDown={() => setModalOpen(false)}>
          <div className="to-modal" onMouseDown={e => e.stopPropagation()}>
            <h3>保存排版方案</h3>
            <p className="to-tip">方案记录三个层级的字体、字号、字重、行距、字距与版心宽度；文字内容不保存。</p>
            <input
              autoFocus
              className="to-modal-input"
              value={schemeName}
              maxLength={40}
              placeholder="为方案命名，例如：展览海报竖版"
              onChange={e => setSchemeName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveScheme()}
            />
            <div className="to-modal-spec">
              {LEVELS.map(l => {
                const c = state.levels[l.key]
                return (
                  <span key={l.key}>
                    <i className={`to-tag to-tag-${l.key}`}>{l.label}</i>
                    {fontSpec(c.family).label} · {c.size}px · {c.weight} · LH {c.lineHeight.toFixed(2)}
                  </span>
                )
              })}
            </div>
            <div className="to-modal-actions">
              <button className="to-btn-ghost" onClick={() => setModalOpen(false)}>取消</button>
              <button className="to-btn-primary" onClick={saveScheme}>保存</button>
            </div>
          </div>
        </div>
      )}

      <div className={`to-toast ${toast ? 'to-toast-show' : ''}`}>{toast}</div>
    </div>
  )
}
