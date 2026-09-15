import React, { useState } from 'react'
import './styles.css'

const colorSets = [
  { bg:'#d9ff3f', ink:'#151515', accent:'#ff5938' },
  { bg:'#ff5938', ink:'#fff8ef', accent:'#d9ff3f' },
  { bg:'#7546e8', ink:'#fff8ef', accent:'#d9ff3f' },
  { bg:'#151515', ink:'#fff8ef', accent:'#4ed5c1' }
]

const palettes = [
  { id:'signal', name:'信号荧光', bg:'#d9ff3f', ink:'#151515', accent:'#ff4f38', paper:'#fff8ef' },
  { id:'night', name:'夜间高反差', bg:'#151515', ink:'#fff8ef', accent:'#d9ff3f', paper:'#262626' },
  { id:'paper', name:'纸张单色', bg:'#f4f1ea', ink:'#171717', accent:'#ff4f38', paper:'#fffaf0' },
  { id:'grape', name:'葡萄电波', bg:'#7546e8', ink:'#fff8ef', accent:'#ffcf3b', paper:'#5630b8' },
  { id:'aqua', name:'青色网格', bg:'#63d9ca', ink:'#102b29', accent:'#ff4f38', paper:'#e7fffb' }
]

const fontOptions = [
  { id:'geometric', name:'几何无衬线' },
  { id:'serif', name:'高反差衬线' }
]

const layoutOptions = [
  { id:'hero', name:'主角居中' },
  { id:'split', name:'上下分割' },
  { id:'grid', name:'信息网格' },
  { id:'diagonal', name:'斜向动势' },
  { id:'frame', name:'边框留白' }
]

const motifOptions = [
  { id:'circle', name:'圆形' },
  { id:'bars', name:'条块' },
  { id:'type', name:'字体图形' },
  { id:'line', name:'动线' },
  { id:'star', name:'星标' }
]

function useRoute() {
  const [route,setRoute] = useState(window.location.pathname)
  React.useEffect(()=>{ const fn=()=>setRoute(window.location.pathname); window.addEventListener('popstate',fn); return()=>window.removeEventListener('popstate',fn) },[])
  const go = (to)=>{ window.history.pushState({},'',to); setRoute(to); window.scrollTo(0,0) }
  return [route,go]
}

function Header({go, route}) {
  const links=[['/learn','学习路径'],['/cases','案例档案'],['/draw','抽签器'],['/works','作品墙']]
  return <header className="header"><button className="brand" onClick={()=>go('/')}>STUDIO <span>14</span></button><nav>{links.map(([href,label])=><button key={href} className={route===href?'active':''} onClick={()=>go(href)}>{label}</button>)}</nav><div className="header-right"><span className="status-dot"/>实验室在线 <span className="menu">↗</span></div></header>
}

function Pill({children, dark=false}) { return <span className={'pill '+(dark?'pill-dark':'')}>{children}</span> }
function Arrow() { return <span className="arrow">↗</span> }

function Home({go}) {
  const [palette,setPalette]=useState(0)
  const [focus,setFocus]=useState(48)
  const c=colorSets[palette]
  return <main>
    <section className="hero" style={{'--hero-bg':c.bg,'--hero-ink':c.ink,'--hero-accent':c.accent}}>
      <div className="hero-kicker"><Pill dark>学习实验室 / 001</Pill><span>从观看开始，成为设计师</span></div>
      <div className="hero-grid">
        <div className="hero-title-wrap"><p className="eyebrow">平面设计 · 视觉思维</p><h1>把世界<br/><i>排</i>好看。</h1><p className="hero-copy">一个为零基础准备的互动设计空间。<br/>在这里，先动手，再理解为什么。</p><button className="text-link" onClick={()=>go('/draw')}>抽一张设计任务 <Arrow/></button></div>
        <div className="hero-stage"><div className="stage-top"><span>互动画布 / LIVE CANVAS</span><span>颜色 {String(palette+1).padStart(2,'0')} / 04</span></div><div className="canvas" role="button" tabIndex="0" aria-label="改变画布色彩情绪" onClick={()=>setPalette((palette+1)%colorSets.length)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setPalette((palette+1)%colorSets.length)}}}><div className="shape shape-a"/><div className="shape shape-b"/><div className="shape shape-c"/><div className="canvas-label">点击画布<br/><b>改变情绪</b></div><div className="target-dot"/></div><div className="stage-bottom"><span>构图练习 · 点击画布切换</span><span className="mono">X {focus} / Y 62</span></div></div>
      </div>
      <div className="hero-footer"><span>SCROLL TO COMPOSE ↓</span><div className="range-wrap"><span>安静</span><input aria-label="视觉张力" type="range" min="0" max="100" value={focus} onChange={e=>setFocus(e.target.value)}/><span>张力</span></div><span>东京 · 2024—∞</span></div>
    </section>
    <section className="intro-strip"><div className="index-mark">/ 01</div><div><h2>设计不是装饰，<br/><em>是一次选择。</em></h2><p>我们把复杂的设计知识拆成可以观察、可以操作的瞬间。每次抽签只解决一张视觉方案，让你的选择留下痕迹。</p></div><button className="circle-button" onClick={()=>go('/draw')}>开始抽签 <Arrow/></button></section>
    <section className="portal-section"><div className="section-head"><div><p className="eyebrow">THE LAB / 四个入口</p><h2>从一个好奇心<br/>开始。</h2></div><span className="mono">抽签 / 编辑 / 回看 / 比较</span></div><div className="portal-grid"><Portal n="01" title="学习路径" desc="从构图到视觉层级，建立你的第一套设计语言。" tone="lime" onClick={()=>go('/learn')}/><Portal n="02" title="案例档案" desc="拆开那些让人过目不忘的海报、系统与字体。" tone="orange" onClick={()=>go('/cases')}/><Portal n="03" title="抽签器" desc="随机获得主题、人群、场景和限制，完成一张视觉方案。" tone="purple" onClick={()=>go('/draw')}/><Portal n="04" title="作品墙" desc="保存你的实验，看看灵感如何彼此碰撞。" tone="blue" onClick={()=>go('/works')}/></div></section>
    <section className="quote-band"><span className="quote-mark">“</span><p>留白不是空白，<br/><strong>是给想法呼吸的地方。</strong></p><span className="mono">— STUDIO 14 NOTE 0001</span></section>
  </main>
}

function Portal({n,title,desc,tone,onClick}) { return <button className={'portal portal-'+tone} onClick={onClick}><div className="portal-num">{n}</div><div className="portal-icon">✳</div><h3>{title}</h3><p>{desc}</p><span className="portal-cta">开始探索 <Arrow/></span></button> }

function ContentPage({type,go}) {
  const [items,setItems]=useState([])
  const [selected,setSelected]=useState(null)
  const [state,setState]=useState('loading')
  const config={learn:{label:'学习路径',title:'建立你的第一套\n设计语言。',desc:'四个关键概念，带你从“看起来不错”走向“知道为什么”。',button:'从构图开始'},cases:{label:'案例档案',title:'拆开那些\n留下来的画面。',desc:'从包豪斯到今天，设计史是一座可以反复进入的实验室。',button:'随机案例'},practice:{label:'练习场',title:'先动手，\n再理解。',desc:'短小、直接、立即看到变化。把设计概念变成你的判断力。',button:'开始 30 秒挑战'}}[type]
  React.useEffect(()=>{
    const controller=new AbortController()
    setState('loading'); setItems([]); setSelected(null)
    fetch('/api/content?type='+(type==='learn'?'lesson':type==='cases'?'case':'exercise'),{signal:controller.signal}).then(r=>{if(!r.ok) throw new Error('load failed');return r.json()}).then(data=>{setItems(data);setState('ready')}).catch(error=>{if(error.name!=='AbortError') setState('error')})
    return()=>controller.abort()
  },[type])
  React.useEffect(()=>{if(!selected)return;const close=e=>{if(e.key==='Escape')setSelected(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[selected])
  const openFeatured=()=>{if(!items.length)return;setSelected(type==='cases'?items[Math.floor(Math.random()*items.length)]:items[0])}
  return <main className="inner-page"><section className="page-hero"><div><Pill>{config.label} / 0{type==='learn'?1:type==='cases'?2:3}</Pill><h1>{config.title.split('\n').map((x,i)=><React.Fragment key={x}>{x}{i===0&&<br/>}</React.Fragment>)}</h1><p>{config.desc}</p></div><div className="page-orbit"><div className="orbit-ring"/><span>↗</span></div></section><div className="content-toolbar"><span className="mono">{state==='loading'?'正在编排…':state==='error'?'内容暂时无法加载':`${items.length} 个单元 · 为你编排`}</span><button className="outline-button" disabled={state!=='ready'||!items.length} onClick={openFeatured}>{config.button} <Arrow/></button></div><section className="content-grid">{state==='error'?<div className="empty-state">连接实验室失败，请刷新页面重试。</div>:items.map((item,i)=><article className={'content-card card-'+item.accent} key={item.id}><div className="card-meta"><span>{item.meta}</span><span>0{i+1}</span></div><div className="card-art"><span className="art-symbol">{type==='learn'?['◒','◈','Aa','▦'][i%4]:type==='cases'?['▦','＋','Aa'][i%3]:'✳'}</span></div><div className="card-body"><h3>{item.title}</h3><h4>{item.subtitle}</h4><p>{item.body}</p><button className="text-link" onClick={()=>setSelected(item)}>打开单元 <Arrow/></button></div></article>)}</section>{selected&&<UnitDialog item={selected} type={type} onClose={()=>setSelected(null)} />}</main>
}

function UnitDialog({item,type,onClose}) {
  const notes={learn:['先观察：画面中什么最先吸引你？','再尝试：只改变一个变量，对比前后差异。'],cases:['先拆解：找出主角、网格与视觉路径。','再思考：如果拿掉一个元素，秩序还成立吗？'],practice:['计时 30 秒，只做一次明确选择。','完成后说出你的主角、对比和阅读顺序。']}[type]
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className={'unit-dialog card-'+item.accent} role="dialog" aria-modal="true" aria-labelledby="unit-title" onMouseDown={e=>e.stopPropagation()}><div className="dialog-top"><Pill>{item.meta}</Pill><button className="icon-button" aria-label="关闭单元" onClick={onClose}>×</button></div><div className="dialog-art"><span>{type==='practice'?'30″':'Aa'}</span></div><div className="dialog-copy"><p className="eyebrow">核心概念</p><h2 id="unit-title">{item.title}</h2><h3>{item.subtitle}</h3><p>{item.body}</p><ol><li>{notes[0]}</li><li>{notes[1]}</li></ol><button className="outline-button" onClick={onClose}>读完，返回列表 <Arrow/></button></div></section></div>
}

function briefText(part) {
  return typeof part === 'string' ? part : part?.label || ''
}

function briefHint(part) {
  return typeof part === 'string' ? '' : part?.hint || ''
}

function makeDesign(brief) {
  return {
    palette:'signal',
    fontFamily:'geometric',
    layout:'hero',
    motif:'circle',
    density:2,
    headline:briefText(brief.theme),
    subline:`${briefText(brief.audience)} · ${briefText(brief.scene)}`
  }
}

function MiniPoster({result, taskId, className=''}) {
  const palette = palettes.find(item => item.id === result.palette) || palettes[0]
  return <article
    className={`mini-poster palette-${palette.id} font-${result.fontFamily} layout-${result.layout} motif-${result.motif} ${className}`}
    style={{'--poster-bg':palette.bg,'--poster-ink':palette.ink,'--poster-accent':palette.accent,'--poster-paper':palette.paper,'--poster-density':result.density}}
  >
    <div className="poster-bleed">
      <span className="poster-index">TASK/{String(taskId).padStart(3,'0')}</span>
      <div className="poster-graphic" aria-hidden="true"><span/><span/><span/></div>
      <div className="poster-copy">
        <h3>{result.headline}</h3>
        <p>{result.subline}</p>
      </div>
      <span className="poster-foot">STUDIO 14 · VISUAL ANSWER</span>
    </div>
  </article>
}

function OptionGroup({label, options, value, onChange, disabled}) {
  return <fieldset className="design-control">
    <legend>{label}</legend>
    <div className="option-row">
      {options.map(option => <button key={option.id} type="button" className={value===option.id?'selected':''} disabled={disabled} onClick={()=>onChange(option.id)}>{option.name}</button>)}
    </div>
  </fieldset>
}

function BriefCard({kind, label, hint, wide=false}) {
  return <article className={`brief-card brief-${kind} ${wide?'wide':''}`}>
    <span className="mono">{label}</span>
    <h3>{briefText(hint)}</h3>
    <p>{briefHint(hint)}</p>
  </article>
}

function DrawStudio() {
  const [task,setTask]=useState(null)
  const [design,setDesign]=useState(null)
  const [reflection,setReflection]=useState('')
  const [drawing,setDrawing]=useState(false)
  const [saving,setSaving]=useState(false)
  const [drawError,setDrawError]=useState('')
  const [submitError,setSubmitError]=useState('')
  const [submitted,setSubmitted]=useState(null)
  const [loadingTask,setLoadingTask]=useState(true)
  const [draftStatus,setDraftStatus]=useState('')
  const draftTimer=React.useRef(null)
  const lastSavedDraft=React.useRef('')

  React.useEffect(()=>()=>window.clearTimeout(draftTimer.current),[])

  const hydrateTask=(activeTask)=>{
    setTask(activeTask)
    if(activeTask.draft?.result) {
      setDesign(activeTask.draft.result)
      setReflection(activeTask.draft.reflection || '')
      lastSavedDraft.current=JSON.stringify({result:activeTask.draft.result,reflection:activeTask.draft.reflection || ''})
    } else {
      const initialDesign=makeDesign(activeTask.brief)
      setDesign(initialDesign)
      setReflection('')
      lastSavedDraft.current=JSON.stringify({result:initialDesign,reflection:''})
    }
  }

  React.useEffect(()=>{
    const controller = new AbortController()
    fetch('/api/draw-tasks/active',{signal:controller.signal})
      .then(response=>{
        if(!response.ok) throw new Error('load active task failed')
        return response.json()
      })
      .then(activeTask=>{
        if(activeTask) {
          hydrateTask(activeTask)
          if(activeTask.draft) setDraftStatus('saved')
        }
      })
      .catch(error=>{
        if(error.name !== 'AbortError') setDrawError('未完成的任务暂时无法恢复，请重新抽签。')
      })
      .finally(()=>{
        if(!controller.signal.aborted) setLoadingTask(false)
      })
    return()=>controller.abort()
  },[])

  React.useEffect(()=>{
    if(!task || !design || submitted || task.status !== 'active') return
    const payload={result:design,reflection}
    const signature=JSON.stringify(payload)
    if(signature === lastSavedDraft.current) return
    setDraftStatus('saving')
    const flushDraft=(keepalive=false)=>fetch(`/api/draw-tasks/${task.id}/draft`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),
      keepalive
    }).then(response=>{
      if(!response.ok) throw new Error('save draft failed')
      lastSavedDraft.current=signature
      setDraftStatus('saved')
    }).catch(()=>{
      if(!keepalive) setDraftStatus('error')
    })
    const handlePageHide=()=>{
      if(JSON.stringify(payload) !== lastSavedDraft.current) flushDraft(true)
    }
    window.addEventListener('pagehide',handlePageHide)
    window.clearTimeout(draftTimer.current)
    draftTimer.current=window.setTimeout(()=>flushDraft(),500)
    return()=>{
      window.removeEventListener('pagehide',handlePageHide)
      window.clearTimeout(draftTimer.current)
    }
  },[task,design,reflection,submitted])

  const drawTask=async()=>{
    if(drawing||saving) return
    setDrawing(true)
    setDrawError('')
    try {
      const response=await fetch('/api/draw-tasks',{method:'POST'})
      if(!response.ok) throw new Error('draw failed')
      const nextTask=await response.json()
      const initialDesign=makeDesign(nextTask.brief)
      setTask(nextTask)
      setDesign(initialDesign)
      setReflection('')
      lastSavedDraft.current=JSON.stringify({result:initialDesign,reflection:''})
      setDraftStatus('')
      setSubmitted(null)
      setSubmitError('')
    } catch {
      setDrawError('任务签筒暂时无法连接，请稍后再试。')
    } finally {
      setDrawing(false)
    }
  }

  const updateDesign=(key,value)=>setDesign(current=>({...current,[key]:value}))

  const submitWork=async()=>{
    if(!task||saving) return
    const headline=design.headline.trim()
    const subline=design.subline.trim()
    if(!headline||!subline) {
      setSubmitError('请先补全海报上的标题和辅助文案。')
      return
    }
    setSaving(true)
    setSubmitError('')
    try {
      const response=await fetch(`/api/draw-tasks/${task.id}/submit`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({result:{...design,headline,subline},reflection:reflection.trim()})
      })
      const data=await response.json().catch(()=>({}))
      if(!response.ok) throw new Error(data.error || 'submit failed')
      setTask(data)
      setDesign(data.result)
      setReflection(data.reflection)
      lastSavedDraft.current=JSON.stringify({result:data.result,reflection:data.reflection})
      setSubmitted(data)
      setDraftStatus('')
    } catch(error) {
      setSubmitError(error.message === 'Task has already been submitted' ? '这张任务已经提交过了。' : '提交失败，请检查方案后再试。')
    } finally {
      setSaving(false)
    }
  }

  return <section className="draw-studio">
    <div className="draw-launch">
      <div>
        <p className="eyebrow">RANDOM BRIEF / NO AUTO JUDGEMENT</p>
        <h2>一次只抽一张，<br/><em>然后做出选择。</em></h2>
        <p>系统会从 API 随机组合主题、目标人群、使用场景和限制条件。任务由服务端生成并保存；页面重新渲染不会让同一题重复变化。</p>
      </div>
      <button className="big-draw-button" disabled={loadingTask||drawing||saving} onClick={drawTask}>
        <span>{loadingTask?'正在恢复…':drawing?'正在抽签…':task?'再抽一张':'开始抽签'}</span>
        <b>✦</b>
      </button>
    </div>
    {drawError && <p className="form-error draw-error" role="alert">{drawError}</p>}

    {!task && <div className="draw-empty">
      <span>{loadingTask?'…':'?'}</span>
      <h3>{loadingTask?'正在检查未完成任务':'签筒已经准备好'}</h3>
      <p>{loadingTask?'如果浏览器重新渲染过，当前任务也不会被重新生成。':'完成后只提交作品与 brief，不做自动评分。你可以在档案中比较不同限制下的视觉选择。'}</p>
    </div>}

    {task && design && <>
      <div className="brief-panel">
        <div className="brief-heading">
          <Pill>Brief #{String(task.id).padStart(3,'0')}</Pill>
          <span className="mono">{new Date(task.created_at).toLocaleString('zh-CN')}</span>
        </div>
        <div className="brief-grid">
          <BriefCard kind="theme" label="随机主题" hint={task.brief.theme}/>
          <BriefCard kind="audience" label="目标人群" hint={task.brief.audience}/>
          <BriefCard kind="scene" label="使用场景" hint={task.brief.scene}/>
          <BriefCard kind="constraint" label="限制条件" hint={task.brief.constraint}/>
        </div>
      </div>

      {submitted && <div className="submit-banner" role="status">
        <span>已保存完整 brief 与最终视觉方案</span>
        <p>系统不会评价好坏。前往历史档案，可以把这次选择和其他需求放在一起比较。</p>
      </div>}

      <div className="workspace-grid">
        <div className="poster-stage">
          <div className="stage-label"><span>简单视觉方案</span><span>{palettes.find(p=>p.id===design.palette)?.name}</span></div>
          <MiniPoster result={design} taskId={task.id}/>
        </div>

        <div className="design-panel">
          <h3>视觉方案工作台</h3>
          <p className="panel-note">限制条件不会被系统强制执行，它是你做取舍时的提示。</p>
          <label className="text-control">
            <span>主标题</span>
            <input value={design.headline} maxLength={40} disabled={submitted} onChange={e=>updateDesign('headline',e.target.value)}/>
          </label>
          <label className="text-control">
            <span>辅助文案</span>
            <input value={design.subline} maxLength={70} disabled={submitted} onChange={e=>updateDesign('subline',e.target.value)}/>
          </label>
          <OptionGroup label="色彩" options={palettes} value={design.palette} disabled={submitted} onChange={v=>updateDesign('palette',v)}/>
          <OptionGroup label="字体气质" options={fontOptions} value={design.fontFamily} disabled={submitted} onChange={v=>updateDesign('fontFamily',v)}/>
          <OptionGroup label="版式" options={layoutOptions} value={design.layout} disabled={submitted} onChange={v=>updateDesign('layout',v)}/>
          <OptionGroup label="图形母题" options={motifOptions} value={design.motif} disabled={submitted} onChange={v=>updateDesign('motif',v)}/>
          <fieldset className="design-control density-control">
            <legend>元素密度</legend>
            <input type="range" min="1" max="3" step="1" value={design.density} disabled={submitted} aria-label="元素密度" onChange={e=>updateDesign('density',Number(e.target.value))}/>
            <div><span>留白</span><b>{design.density}</b><span>密集</span></div>
          </fieldset>
          <label className="text-control reflection-control">
            <span>给自己的设计备注（可选）</span>
            <textarea value={reflection} maxLength={280} disabled={submitted} placeholder="例如：我把标题放在边缘，用大面积圆形呼应限制……" onChange={e=>setReflection(e.target.value)}/>
          </label>
          {submitError && <p className="form-error" role="alert">{submitError}</p>}
          <div className="workspace-actions">
            <button className="outline-button" disabled={saving||submitted} onClick={submitWork}>{saving?'提交中…':submitted?'已提交 ✓':'提交作品'} <Arrow/></button>
            <button className="text-link" disabled={drawing||saving} onClick={drawTask}>{submitted?'抽下一张任务':'放弃并换一题'}</button>
            {!submitted && draftStatus && <span className={`draft-status draft-${draftStatus}`} role="status">
              {draftStatus==='saving'?'草稿保存中…':draftStatus==='saved'?'草稿已保存':draftStatus==='error'?'草稿保存失败':''}
            </span>}
          </div>
        </div>
      </div>
    </>}
  </section>
}

function DrawArchive({refreshKey}) {
  const [items,setItems]=useState([])
  const [state,setState]=useState('idle')
  const [error,setError]=useState('')
  const [compareIds,setCompareIds]=useState([])

  const load=async()=>{
    setState('loading')
    setError('')
    try {
      const response=await fetch('/api/draw-tasks')
      if(!response.ok) throw new Error('load failed')
      setItems(await response.json())
      setState('ready')
    } catch {
      setState('error')
      setError('历史任务暂时无法加载。')
    }
  }

  React.useEffect(()=>{ if(refreshKey > 0) load() },[refreshKey])

  const toggleCompare=(id)=>{
    setCompareIds(current=>{
      if(current.includes(id)) return current.filter(item=>item!==id)
      if(current.length>=3) return current
      return [...current,id]
    })
  }

  const selectedTasks=compareIds.map(id=>items.find(item=>item.id===id)).filter(Boolean)

  return <section className="draw-archive">
    <div className="archive-toolbar">
      <div><p className="eyebrow">SAVED BRIEFS / SAVED CHOICES</p><h2>过去抽到的任务</h2></div>
      <button className="outline-button" disabled={state==='loading'} onClick={load}>{state==='loading'?'读取中…':state==='idle'?'读取历史档案':'刷新档案'} <Arrow/></button>
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {state==='ready' && items.length===0 && <div className="empty-state archive-empty">还没有提交过的抽签任务。先完成一张视觉方案吧。</div>}

    {selectedTasks.length>0 && <div className="compare-board">
      <div className="compare-head"><h3>比较 {selectedTasks.length}/3 张方案</h3><button className="text-link" onClick={()=>setCompareIds([])}>清空比较</button></div>
      <div className="compare-grid">
        {selectedTasks.map(task=><article key={task.id} className="compare-card">
          <MiniPoster result={task.result} taskId={task.id}/>
          <div className="compare-brief">
            <span className="mono">#{String(task.id).padStart(3,'0')} · {new Date(task.submitted_at).toLocaleDateString('zh-CN')}</span>
            <b>{briefText(task.brief.theme)}</b>
            <p>{briefText(task.brief.audience)}</p>
            <p>{briefText(task.brief.scene)}</p>
            <em>{briefText(task.brief.constraint)}</em>
            {task.reflection && <blockquote>{task.reflection}</blockquote>}
          </div>
        </article>)}
      </div>
    </div>}

    {items.length>0 && <div className="archive-grid">
      {items.map(task=><article className="archive-card" key={task.id}>
        <MiniPoster result={task.result} taskId={task.id} className="archive-poster"/>
        <div className="archive-info">
          <span className="mono">#{String(task.id).padStart(3,'0')} · {new Date(task.submitted_at).toLocaleDateString('zh-CN')}</span>
          <h3>{briefText(task.brief.theme)}</h3>
          <dl>
            <dt>人群</dt><dd>{briefText(task.brief.audience)}</dd>
            <dt>场景</dt><dd>{briefText(task.brief.scene)}</dd>
            <dt>限制</dt><dd>{briefText(task.brief.constraint)}</dd>
          </dl>
          {task.reflection && <p>{task.reflection}</p>}
          <button className={compareIds.includes(task.id)?'outline-button selected':'outline-button'} disabled={!compareIds.includes(task.id)&&compareIds.length>=3} onClick={()=>toggleCompare(task.id)}>{compareIds.includes(task.id)?'移出比较':'加入比较'}</button>
        </div>
      </article>)}
    </div>}
  </section>
}

function DrawPage() {
  const [tab,setTab]=useState('studio')
  const [refreshKey,setRefreshKey]=useState(0)
  const changeTab=(next)=>{ setTab(next); if(next==='archive') setRefreshKey(key=>key+1) }

  return <main className="inner-page draw-page">
    <section className="page-hero draw-hero">
      <div>
        <Pill>抽签器 / 03</Pill>
        <h1>随机 brief，<br/><i>具体选择。</i></h1>
        <p>抽题、完成一张简单视觉方案、保存完整上下文。系统只负责记录，不替你判断设计好坏。</p>
      </div>
      <div className="draw-orbit"><span>✦</span><div className="orbit-ring"/></div>
    </section>
    <div className="draw-tabs" role="tablist">
      <button className={tab==='studio'?'active':''} aria-selected={tab==='studio'} role="tab" onClick={()=>changeTab('studio')}>任务工作台</button>
      <button className={tab==='archive'?'active':''} aria-selected={tab==='archive'} role="tab" onClick={()=>changeTab('archive')}>历史与比较</button>
    </div>
    <div className={tab==='studio'?'draw-view':'draw-view hidden'}><DrawStudio/></div>
    <div className={tab==='archive'?'draw-view':'draw-view hidden'}><DrawArchive refreshKey={refreshKey}/></div>
  </main>
}

function Works({go}) {
  const [works,setWorks]=useState([]); const [title,setTitle]=useState(''); const [saved,setSaved]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState('')
  const load=()=>fetch('/api/works').then(r=>{if(!r.ok)throw new Error('load failed');return r.json()}).then(data=>{setWorks(data);setError('')}).catch(()=>setError('作品暂时无法加载，请稍后重试。'))
  React.useEffect(()=>{ load() },[])
  const save=async()=>{if(saving)return;const cleanTitle=title.trim();if(!cleanTitle){setError('请先为这次实验命名。');return}setSaving(true);setError('');try{const response=await fetch('/api/works',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:cleanTitle,author:'你',tags:'composition · study'})});if(!response.ok)throw new Error('save failed');await response.json();setTitle('');setSaved(true);await load();setTimeout(()=>setSaved(false),1800)}catch{setError('保存失败，请检查连接后重试。')}finally{setSaving(false)}}
  return <main className="inner-page"><section className="page-hero works-hero"><div><Pill>作品墙 / 04</Pill><h1>让实验<br/><i>留下来。</i></h1><p>每一次尝试都值得被看见。保存你的练习，给未来的自己留一张便签。</p></div><div className="sticker">MAKE<br/>SOMETHING<br/><b>VISIBLE</b></div></section><section className="save-box"><div><span className="eyebrow">保存一张新实验</span><h2>这次你在研究什么？</h2></div><div className="save-area"><div className="save-form"><input value={title} maxLength="80" aria-label="作品名称" onChange={e=>{setTitle(e.target.value);setError('')}} onKeyDown={e=>{if(e.key==='Enter')save()}} placeholder="例如：让留白更有重量"/><button disabled={saving} onClick={save}>{saving?'保存中…':saved?'已保存 ✓':'保存作品'} <Arrow/></button></div>{error&&<p className="form-error" role="alert">{error}</p>}</div></section><section className="works-grid">{works.length===0?<div className="empty-state">还没有作品。去抽签器完成第一个挑战吧 <button className="text-link" onClick={()=>go('/draw')}>开始抽签 <Arrow/></button></div>:works.map((w,i)=><article className={'work-card work-'+(i%4)} key={w.id}><div className="work-visual"><span>{['01','Aa','✳','—'][i%4]}</span></div><div className="work-info"><b>{w.title}</b><span>{w.author} · {new Date(w.created_at).toLocaleDateString('zh-CN')}</span></div></article>)}</section></main>
}

function NotFound({go}) { return <main className="not-found"><Pill>404 / LOST GRID</Pill><h1>这块画布<br/>还没有内容。</h1><button className="outline-button" onClick={()=>go('/')}>返回实验室 <Arrow/></button></main> }

function App(){ const [route,go]=useRoute(); const pages={'/':<Home go={go}/>, '/learn':<ContentPage type="learn" go={go}/>, '/cases':<ContentPage type="cases" go={go}/>, '/draw':<DrawPage/>, '/practice':<ContentPage type="practice" go={go}/>, '/works':<Works go={go}/>}; return <><Header go={go} route={route}/>{pages[route]||<NotFound go={go}/>}<footer><span>STUDIO 14</span><span>一个关于观看的学习实验室</span><span className="mono">© 2024—∞</span></footer></> }

export default App
