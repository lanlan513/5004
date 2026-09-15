import React, { useEffect, useRef, useState } from 'react'
import { gazeWorks, hitZone, isInAnyZone } from './gazeWorks.js'

// 把指针事件换算成图片内部相对坐标（0–1）。
// 只依赖 <img> 自身渲染后的包围盒，不依赖窗口尺寸或 CSS 像素假设，
// 因此窗口缩放、图片随容器伸缩、高清屏都能准确映射。
function eventToImagePoint(event, img) {
  const rect = img.getBoundingClientRect()
  const x = (event.clientX - rect.left) / rect.width
  const y = (event.clientY - rect.top) / rect.height
  return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) }
}

// 在相对坐标上叠加的标记层：核心区域、其他观察者落点、用户落点。
function WorkLayers({ work, userPoint, stats, mode }) {
  const count = work.observers.length + ((stats && stats.total) || 0)
  const dots = (stats && stats.recent && stats.recent.length
    ? [...work.observers, ...stats.recent]
    : work.observers)
  return <div className="gaze-layers" aria-hidden="true">
    {mode === 'reveal' && work.zones.map((zone, i) => {
      const style = zone.type === 'ellipse'
        ? { left: `${(zone.cx - zone.rx) * 100}%`, top: `${(zone.cy - zone.ry) * 100}%`, width: `${zone.rx * 200}%`, height: `${zone.ry * 200}%`, borderRadius: '50%' }
        : { left: `${zone.x * 100}%`, top: `${zone.y * 100}%`, width: `${zone.w * 100}%`, height: `${zone.h * 100}%` }
      return <React.Fragment key={i}>
        <div className="gaze-zone" style={style}/>
        <div className="gaze-zone-label" style={{ left: `${(zone.type === 'ellipse' ? zone.cx - zone.rx : zone.x) * 100}%`, top: `${(zone.type === 'ellipse' ? zone.cy - zone.ry : zone.y) * 100}%` }}><span>{zone.note}</span></div>
      </React.Fragment>
    })}
    {mode === 'reveal' && dots.map((p, i) =>
      <span key={i} className="gaze-dot" style={{ left: `${p[0] * 100}%`, top: `${p[1] * 100}%` }}/>
    )}
    {userPoint && (
      <span className="gaze-user" style={{ left: `${userPoint.x * 100}%`, top: `${userPoint.y * 100}%` }}>
        <span className="gaze-user-ring"/>你
      </span>
    )}
    {mode === 'reveal' && <p className="gaze-layer-count mono">{count} 位观察者的视觉焦点</p>}
  </div>
}

function GazeImage({ work, stage, userPoint, stats, onPick }) {
  const imgRef = useRef(null)
  const [primeTick, setPrimeTick] = useState(0)

  useEffect(() => {
    if (stage !== 'prime') { setPrimeTick(0); return }
    const id = setInterval(() => setPrimeTick(t => Math.min(t + 1, 2)), 1000)
    return () => clearInterval(id)
  }, [stage, work.id])

  const pick = (event) => {
    if (stage !== 'live' || !imgRef.current) return
    event.preventDefault()
    const point = eventToImagePoint(event, imgRef.current)
    onPick(point)
  }

  const mode = stage === 'prime' ? 'prime' : stage === 'live' ? 'live' : 'reveal'

  return <div className={'gaze-figure gaze-stage-' + stage}>
    <img
      ref={imgRef}
      src={work.file}
      alt={work.title + ' · ' + work.kind}
      draggable="false"
      className="gaze-img"
      onPointerDown={pick}
      onContextMenu={e => e.preventDefault()}
    />
    <WorkLayers work={work} userPoint={userPoint} stats={stats} mode={mode}/>
    {stage === 'prime' && <div className="gaze-prime"><span className="mono">准备好了吗</span><b>{3 - primeTick}</b><p>下一张：{work.title}</p></div>}
    {stage === 'live' && <div className="gaze-live-hint mono"><span className="gaze-hint-dot"/>只可以点击一次 · 点击第一眼落点</div>}
  </div>
}

export default function GazeTest({ go }) {
  // stage: intro | prime | live | reveal | done
  const [stage, setStage] = useState('intro')
  const [index, setIndex] = useState(0)
  const [point, setPoint] = useState(null)
  const [latencyMs, setLatencyMs] = useState(null)
  const [answers, setAnswers] = useState([])
  const [statsMap, setStatsMap] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [savedId, setSavedId] = useState(null)
  const liveStart = useRef(0)
  const timers = useRef([])

  const work = gazeWorks[index]

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => () => clearTimers(), [])

  const begin = () => {
    setSaveError(''); setSavedId(null)
    setIndex(0); setAnswers([]); setStatsMap({})
    primeFor(0)
  }

  const primeFor = (i) => {
    clearTimers()
    setIndex(i); setPoint(null); setLatencyMs(null); setStage('prime')
    // 3-2-1 倒计时，保证用户带着真实的第一反应进入
    timers.current.push(setTimeout(() => setStage('live'), 3000))
    liveStart.current = performance.now() + 3000
  }

  const handlePick = (p) => {
    if (stage !== 'live' || point) return
    clearTimers()
    setPoint(p)
    setLatencyMs(Math.max(0, Math.round(performance.now() - liveStart.current)))
    setStage('reveal')
  }

  const next = () => {
    const hit = !!point && isInAnyZone(point.x, point.y, work.zones)
    const zone = point ? hitZone(point.x, point.y, work.zones) : null
    const record = { workId: work.id, x: point.x, y: point.y, latencyMs, hit, target: work.targetLabel }
    const nextAnswers = [...answers, record]
    setAnswers(nextAnswers)
    if (index < gazeWorks.length - 1) {
      primeFor(index + 1)
    } else {
      finish(nextAnswers)
    }
  }

  const finish = async (finalAnswers) => {
    setStage('done'); setSaving(true); setSaveError('')
    try {
      const response = await fetch('/api/gaze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers })
      })
      if (!response.ok) throw new Error('save failed')
      const data = await response.json()
      setStatsMap(data.stats || {})
      setSavedId(data.id)
    } catch {
      setSaveError('结果暂时没能存入实验室，但你的对比仍保留在本页。')
    } finally {
      setSaving(false)
    }
  }

  const hit = point ? isInAnyZone(point.x, point.y, work.zones) : false
  const zone = point ? hitZone(point.x, point.y, work.zones) : null
  const hitCount = answers.filter(a => a.hit).length + (hit ? 1 : 0)
  const answeredCount = answers.length + (stage === 'reveal' ? 1 : 0)

  let body
  if (stage === 'intro') {
    body = <section className="gaze-intro">
      <div className="gaze-intro-mark mono">LAB TEST / 05 · 视觉注意</div>
      <h1>第一眼<br/><i>落在哪里？</i></h1>
      <p className="gaze-intro-copy">一次展示一张完整设计作品。你只有一次点击机会——点在画面上最先抓住你视线的位置。提交后，你会看到其他观察者的常见焦点，以及设计师预设的核心区域（人物、标题、产品或颜色区域），比较你的注意路径和作品意图是否一致。</p>
      <ol className="gaze-rules">
        <li><b>01</b><span>每张作品先倒计时 3 秒，随后完整展示</span></li>
        <li><b>02</b><span>只允许点击一次，凭直觉，不要移动鼠标寻找</span></li>
        <li><b>03</b><span>点击后立即揭示：你的落点 vs 他人焦点 vs 设计意图</span></li>
        <li><b>04</b><span>共 {gazeWorks.length} 张作品，结束后自动保存你的点击坐标与结果</span></li>
      </ol>
      <div className="gaze-intro-foot">
        <button className="outline-button" onClick={begin}>开始第一眼测试 <span className="arrow">↗</span></button>
        <span className="mono">{gazeWorks.length} WORKS · 约 2 分钟 · 坐标按图片比例保存</span>
      </div>
    </section>
  } else if (stage === 'done') {
    const finalHit = answers.filter(a => a.hit).length
    const verdict = finalHit >= 3 ? '你的眼睛和设计师想到了一起。' : finalHit >= 2 ? '你抓住了一半的设计意图。' : '你的注意路径很独立——看看画面把你带去了哪里。'
    body = <section className="gaze-done">
      <p className="eyebrow">TEST COMPLETE · 测试结束</p>
      <h1>{finalHit} / {gazeWorks.length}</h1>
      <p className="gaze-verdict">{verdict}</p>
      {saving && <p className="gaze-save-state mono">正在保存你的点击坐标…</p>}
      {saveError && <p className="form-error" role="alert">{saveError}</p>}
      {savedId && <p className="gaze-save-state mono">已保存 · 记录编号 #{savedId} · 坐标已并入观察者焦点</p>}
      <div className="gaze-summary-grid">
        {gazeWorks.map((w) => {
          const a = answers.find(r => r.workId === w.id)
          return <article key={w.id} className={'gaze-summary ' + (a && a.hit ? 'is-hit' : 'is-miss')}>
            <div className="gaze-summary-figure">
              <img src={w.file} alt="" draggable="false"/>
              {a && <span className="gaze-user gaze-user-small" style={{ left: `${a.x * 100}%`, top: `${a.y * 100}%` }}><span className="gaze-user-ring"/></span>}
            </div>
            <div className="gaze-summary-meta">
              <span className={'gaze-badge ' + (a && a.hit ? 'gaze-badge-hit' : 'gaze-badge-miss')}>{a && a.hit ? '命中核心' : '偏离意图'}</span>
              <h3>{w.title}</h3>
              <p className="mono">{w.targetLabel} · {a ? `反应 ${(a.latencyMs / 1000).toFixed(2)}s` : '未作答'}</p>
            </div>
          </article>
        })}
      </div>
      <div className="gaze-done-actions">
        <button className="outline-button" onClick={begin}>再测一次 <span className="arrow">↗</span></button>
        <button className="text-link" onClick={() => go('/practice')}>返回练习场 <span className="arrow">↗</span></button>
      </div>
    </section>
  } else {
    const progress = stage === 'reveal' ? index + 1 : index
    body = <section className="gaze-run">
      <div className="gaze-run-head">
        <span className="mono">WORKS {String(index + 1).padStart(2, '0')} / {String(gazeWorks.length).padStart(2, '0')}</span>
        <span className="mono">目标 · {work.targetLabel} · {work.kind}</span>
      </div>
      <div className="gaze-progress"><i style={{ width: `${(progress / gazeWorks.length) * 100}%` }}/></div>
      <div className="gaze-board">
        <GazeImage work={work} stage={stage} userPoint={point} stats={statsMap[work.id]} onPick={handlePick}/>
        <aside className="gaze-panel">
          {stage === 'prime' ? <>
            <p className="eyebrow">NEXT · 下一张</p>
            <h2>{work.title}</h2>
            <p className="gaze-panel-kind mono">{work.kind} · 观察目标：{work.targetLabel}</p>
            <p className="gaze-panel-brief">{work.brief}</p>
            <p className="gaze-prime-note">屏幕上先出现 3 秒倒计时，随后画面揭晓。<br/>相信第一眼，不要犹豫。</p>
          </> : stage === 'live' ? <>
            <p className="eyebrow">CLICK · 你的第一眼</p>
            <h2>现在，<br/>点击落点。</h2>
            <p className="gaze-panel-brief">{work.brief}</p>
            <ul className="gaze-ticks mono">
              <li>只点击一次</li><li>不要来回移动寻找</li><li>点完立即出结果</li>
            </ul>
          </> : <>
            <p className="eyebrow">REVEAL · 结果对比</p>
            <span className={'gaze-badge ' + (hit ? 'gaze-badge-hit' : 'gaze-badge-miss')}>{hit ? '你的第一眼命中了核心区域' : '你的第一眼偏离了预设核心'}</span>
            <h2>{hit ? <>你看到了<br/>设计师想给的。</> : <>画面把你<br/>带去了别处。</>}</h2>
            <div className="gaze-coords mono">
              <span>X {Math.round(point.x * 1000)}</span>
              <span>Y {Math.round(point.y * 1000)}</span>
              <span>反应 {(latencyMs / 1000).toFixed(2)}s</span>
            </div>
            <p className="gaze-panel-insight"><b>{zone ? zone.note : (work.targetLabel + ' · 预设核心区域')}</b>{hit ? '——' : '不在你的落点上。'}{work.insight}</p>
            <div className="gaze-legend">
              <span><i className="legend-user"/>你的落点</span>
              <span><i className="legend-dot"/>其他观察者</span>
              <span><i className="legend-zone"/>设计师核心区域</span>
            </div>
            <button className="outline-button" onClick={next}>{index < gazeWorks.length - 1 ? '下一张作品' : '查看完整结果'} <span className="arrow">↗</span></button>
          </>}
        </aside>
      </div>
      <p className="gaze-coord-note mono">坐标以图片内部比例（0–1000）保存 · 图片缩放后仍准确映射 · 与浏览器窗口宽高无关</p>
    </section>
  }

  return <main className="inner-page gaze-page">
    <section className="gaze-topbar">
      <span className="pill">第一眼测试 / 05</span>
      <h2>First Glance Test</h2>
      <span className="mono">{stage === 'done' ? 'COMPLETE' : `${answeredCount || index} / ${gazeWorks.length} · 命中 ${stage === 'done' ? answers.filter(a => a.hit).length : hitCount}`}</span>
    </section>
    {body}
  </main>
}
