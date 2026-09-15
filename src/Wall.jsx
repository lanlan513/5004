import React, { useRef, useState } from 'react'
import { experiments } from './experiments.js'

const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

/* 统一解析器：把「模式预设 + 用户拖动」合并成每个元素当前的位置与样式 */
function resolveElements(config, mode, free) {
  const merged = {}
  for (const el of config.elements) {
    let p = { ...el[mode] }
    if (free) {
      if (config.control.echo) p = { ...p, x: p.x + free.dx, y: p.y + free.dy }
      else if (el.id === config.control.target) p = { ...p, ...free }
    }
    merged[el.id] = { ...el.style, ...p }
  }
  const out = {}
  for (const el of config.elements) {
    const p = merged[el.id]
    out[el.id] = el.dynamic ? { ...p, ...el.dynamic(p, merged) } : p
  }
  return out
}

function Guide({ g }) {
  if (g.kind === 'vline') return <div className={'xp-guide-v' + (g.active ? ' on' : '')} style={{ left: g.x + '%' }} />
  if (g.kind === 'box') {
    return (
      <div className="xp-guide-box" style={{ left: g.x + '%', top: g.y + '%', width: g.w + '%', height: g.h + '%' }}>
        <span className="xp-guide-box-label">{g.label}</span>
      </div>
    )
  }
  return <div className={'xp-tag' + (g.tone ? ' xp-tag-' + g.tone : '')} style={{ left: g.x + '%', top: g.y + '%' }}>{g.text}</div>
}

function Experiment({ config }) {
  const [mode, setMode] = useState('base') // 'base' 原始状态 | 'modified' 修改状态
  const [free, setFree] = useState(null)   // 用户拖动产生的自由状态，优先于预设
  const [dragging, setDragging] = useState(false)
  const [touched, setTouched] = useState(false)
  const stageRef = useRef(null)
  const dragRef = useRef(null)

  const ctl = config.control
  const els = resolveElements(config, mode, free)
  const metric = config.metric(els)
  const guides = config.guides ? config.guides(els) : []
  const target = els[ctl.target]
  const ctlEl = config.elements.find(e => e.id === ctl.target)

  const currentControl = () => (ctl.echo ? free || { dx: 0, dy: 0 } : { x: target.x, y: target.y, s: target.s })

  /* 指针位移（%）按 control.axis 映射为新的自由状态 */
  const applyDelta = (dx, dy, origin) => {
    if (ctl.echo) return { dx: clamp(origin.dx + dx, -25, 25), dy: clamp(origin.dy + dy, -20, 20) }
    if (ctl.axis === 'x') {
      let x = clamp(origin.x + dx, 4, 96)
      if (ctl.snap && Math.abs(x - ctl.snap.value) < ctl.snap.tol) x = ctl.snap.value
      return { x }
    }
    if (ctl.axis === 'scale') {
      const d = Math.abs(dy) >= Math.abs(dx) ? -dy : dx
      return { s: clamp(origin.s + d, ctl.min || 2, ctl.max || 40) }
    }
    return { x: clamp(origin.x + dx, 4, 96), y: clamp(origin.y + dy, 6, 94) }
  }

  const onPointerDown = e => {
    if (e.button !== undefined && e.button !== 0) return
    e.preventDefault()
    e.currentTarget.focus({ preventScroll: true })
    const rect = stageRef.current.getBoundingClientRect()
    dragRef.current = { px: e.clientX, py: e.clientY, w: rect.width, h: rect.height, origin: currentControl() }
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch (err) { /* noop */ }
    setDragging(true)
    setTouched(true)
  }
  const onPointerMove = e => {
    const d = dragRef.current
    if (!d) return
    setFree(applyDelta((e.clientX - d.px) / d.w * 100, (e.clientY - d.py) / d.h * 100, d.origin))
  }
  const endDrag = () => { dragRef.current = null; setDragging(false) }

  const onKeyDown = e => {
    const step = e.shiftKey ? 6 : 2
    const keys = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    const d = keys[e.key]
    if (!d) return
    e.preventDefault()
    setTouched(true)
    setFree(applyDelta(d[0], d[1], currentControl()))
  }

  const choose = m => { setMode(m); setFree(null) }

  const halfH = ctlEl.kind === 'card' ? target.s * 0.833 : (target.sy ? target.sy : target.s) / 2
  const dragme = {
    left: (ctlEl.anchor === 'left' ? target.x + 7 : target.x) + '%',
    top: Math.max(7, target.y - halfH - 6) + '%',
  }

  return (
    <section className="xp" id={'xp-' + config.id} style={{ '--accent': config.accent }} aria-label={config.name + '实验'}>
      <header className="xp-head">
        <div>
          <span className="xp-index">{config.index} · {config.latin}</span>
          <h2>{config.name}</h2>
        </div>
        <div className="xp-controls">
          {free && <button className="xp-reset" onClick={() => setFree(null)}>↺ 复位</button>}
          <div className="xp-toggle" role="group" aria-label="切换原始状态与修改状态">
            <button className={mode === 'base' ? 'on' : ''} aria-pressed={mode === 'base'} onClick={() => choose('base')}>原始状态</button>
            <button className={mode === 'modified' ? 'on' : ''} aria-pressed={mode === 'modified'} onClick={() => choose('modified')}>修改状态</button>
          </div>
        </div>
      </header>
      <div className="xp-body">
        <div ref={stageRef} className={'xp-stage' + (dragging ? ' dragging' : '')} style={{ background: config.stage.bg, color: config.stage.ink }}>
          {guides.map((g, i) => <Guide key={i} g={g} />)}
          {config.elements.map((el, i) => {
            const p = els[el.id]
            const isCtl = el.id === ctl.target
            const style = {
              left: p.x + '%',
              top: p.y + '%',
              width: el.kind === 'text' ? undefined : p.s + '%',
              height: p.sy ? p.sy + '%' : undefined,
              background: p.fill,
              color: p.color,
              borderRadius: p.radius === undefined ? undefined : p.radius + '%',
              transform: `translate(${el.anchor === 'left' ? '0' : '-50%'}, -50%) rotate(${p.r || 0}deg)`,
              fontSize: el.kind === 'text' ? p.s + 'cqw' : undefined,
              fontWeight: p.weight,
              opacity: p.opacity,
              transitionDelay: ctl.echo ? i * 70 + 'ms' : undefined,
              zIndex: isCtl ? 3 : undefined,
            }
            const handlers = isCtl ? {
              onPointerDown, onPointerMove, onPointerUp: endDrag, onPointerCancel: endDrag, onKeyDown,
              tabIndex: 0,
              role: ctl.axis === 'both' ? 'button' : 'slider',
              'aria-label': config.name + '实验控制元素：' + config.hint,
            } : {}
            return (
              <div key={el.id} className={`xp-el xp-${el.kind}${isCtl ? ' ctl' : ''}${el.cls ? ' ' + el.cls : ''}`} style={style} {...handlers}>
                {el.kind === 'text' && p.text}
                {el.kind === 'card' && <>
                  <span className="xp-card-kicker">{el.card.kicker}</span>
                  <b className="xp-card-title">{el.card.title}</b>
                  {el.card.lines.map((l, li) => <span key={li} className="xp-card-line">{l}</span>)}
                  <span className="xp-card-cta">{el.card.cta}</span>
                </>}
              </div>
            )
          })}
          {!touched && <div className="xp-dragme" style={dragme} aria-hidden="true">拖我</div>}
        </div>
        <aside className="xp-side">
          <p className="xp-hint">
            <span className="xp-hint-icon" aria-hidden="true">{ctl.axis === 'scale' ? '↕' : ctl.axis === 'x' ? '↔' : '✥'}</span>
            {config.hint}
          </p>
          <div className="xp-metric">
            <span className="xp-metric-label">{metric.label}</span>
            <strong className="xp-metric-value">{metric.value}</strong>
            <div className="xp-bar" aria-hidden="true"><i style={{ width: Math.round(clamp(metric.ratio, 0, 1) * 100) + '%' }} /></div>
            <span className="xp-metric-sub">{metric.sub}</span>
          </div>
          <p className="xp-note">{config.note}</p>
        </aside>
      </div>
    </section>
  )
}

export default function Wall() {
  const scrollTo = id => {
    const el = document.getElementById('xp-' + id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <main className="wall-page">
      <section className="wall-hero">
        <div className="wall-hero-top">
          <span className="pill">互动墙 · THE WALL</span>
          <span className="mono">06 EXPERIMENTS · DRAG TO LEARN</span>
        </div>
        <h1>设计原则，<br /><i>上手</i>才知道。</h1>
        <p className="wall-hero-copy">每个实验只动一个元素，立刻看到关系的变化。<br />再切换「原始 / 修改」，看看原则到底做了什么。</p>
        <nav className="wall-nav" aria-label="六个设计原则">
          {experiments.map(e => (
            <button key={e.id} onClick={() => scrollTo(e.id)}>
              <span className="wall-nav-idx">{e.index}</span>{e.name}
            </button>
          ))}
        </nav>
      </section>
      {experiments.map(e => <Experiment key={e.id} config={e} />)}
    </main>
  )
}
