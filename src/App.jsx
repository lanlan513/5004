import React, { useEffect, useState } from 'react'
import Wall from './Wall.jsx'
import './styles.css'

const colorSets = [
  { bg:'#d9ff3f', ink:'#151515', accent:'#ff5938' },
  { bg:'#ff5938', ink:'#fff8ef', accent:'#d9ff3f' },
  { bg:'#7546e8', ink:'#fff8ef', accent:'#d9ff3f' },
  { bg:'#151515', ink:'#fff8ef', accent:'#4ed5c1' }
]

function useRoute() {
  const [route,setRoute] = useState(window.location.pathname)
  useEffect(()=>{ const fn=()=>setRoute(window.location.pathname); window.addEventListener('popstate',fn); return()=>window.removeEventListener('popstate',fn) },[])
  const go = (to)=>{ window.history.pushState({},'',to); setRoute(to); window.scrollTo(0,0) }
  return [route,go]
}

function Header({go, route}) {
  const links=[['/learn','学习路径'],['/cases','案例档案'],['/practice','练习场'],['/wall','互动墙'],['/works','作品墙']]
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
        <div className="hero-title-wrap"><p className="eyebrow">平面设计 · 视觉思维</p><h1>把世界<br/><i>排</i>好看。</h1><p className="hero-copy">一个为零基础准备的互动设计空间。<br/>在这里，先动手，再理解为什么。</p><button className="text-link" onClick={()=>go('/learn')}>探索学习路径 <Arrow/></button></div>
        <div className="hero-stage"><div className="stage-top"><span>互动画布 / LIVE CANVAS</span><span>颜色 {String(palette+1).padStart(2,'0')} / 04</span></div><div className="canvas" role="button" tabIndex="0" aria-label="改变画布色彩情绪" onClick={()=>setPalette((palette+1)%colorSets.length)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setPalette((palette+1)%colorSets.length)}}}><div className="shape shape-a"/><div className="shape shape-b"/><div className="shape shape-c"/><div className="canvas-label">点击画布<br/><b>改变情绪</b></div><div className="target-dot"/></div><div className="stage-bottom"><span>构图练习 · 点击画布切换</span><span className="mono">X {focus} / Y 62</span></div></div>
      </div>
      <div className="hero-footer"><span>SCROLL TO COMPOSE ↓</span><div className="range-wrap"><span>安静</span><input aria-label="视觉张力" type="range" min="0" max="100" value={focus} onChange={e=>setFocus(e.target.value)}/><span>张力</span></div><span>东京 · 2024—∞</span></div>
    </section>
    <section className="intro-strip"><div className="index-mark">/ 01</div><div><h2>设计不是装饰，<br/><em>是一次选择。</em></h2><p>我们把复杂的设计知识拆成可以观察、可以操作的瞬间。每次练习只解决一个问题，让你的眼睛先学会思考。</p></div><button className="circle-button" onClick={()=>go('/practice')}>进入练习场 <Arrow/></button></section>
    <section className="wall-banner"><div className="index-mark">/ WALL</div><div><h2>六条原则，<em>拖动</em>才会懂。</h2><p>对比 · 重复 · 对齐 · 留白 · 亲密性 · 层级——每个实验只动一个元素，立刻看到关系的变化。</p></div><button className="circle-button" onClick={()=>go('/wall')}>进入互动墙 <Arrow/></button></section>
    <section className="portal-section"><div className="section-head"><div><p className="eyebrow">THE LAB / 四个入口</p><h2>从一个好奇心<br/>开始。</h2></div><span className="mono">拖动 / 点击 / 观察</span></div><div className="portal-grid"><Portal n="01" title="学习路径" desc="从构图到视觉层级，建立你的第一套设计语言。" tone="lime" onClick={()=>go('/learn')}/><Portal n="02" title="案例档案" desc="拆开那些让人过目不忘的海报、系统与字体。" tone="orange" onClick={()=>go('/cases')}/><Portal n="03" title="练习场" desc="30 秒一个小挑战，把概念变成肌肉记忆。" tone="purple" onClick={()=>go('/practice')}/><Portal n="04" title="作品墙" desc="保存你的实验，看看灵感如何彼此碰撞。" tone="blue" onClick={()=>go('/works')}/></div></section>
    <section className="quote-band"><span className="quote-mark">“</span><p>留白不是空白，<br/><strong>是给想法呼吸的地方。</strong></p><span className="mono">— STUDIO 14 NOTE 0001</span></section>
  </main>
}

function Portal({n,title,desc,tone,onClick}) { return <button className={'portal portal-'+tone} onClick={onClick}><div className="portal-num">{n}</div><div className="portal-icon">✳</div><h3>{title}</h3><p>{desc}</p><span className="portal-cta">开始探索 <Arrow/></span></button> }

function ContentPage({type,go}) {
  const [items,setItems]=useState([])
  const [selected,setSelected]=useState(null)
  const [state,setState]=useState('loading')
  const config={learn:{label:'学习路径',title:'建立你的第一套\n设计语言。',desc:'四个关键概念，带你从“看起来不错”走向“知道为什么”。',button:'从构图开始'},cases:{label:'案例档案',title:'拆开那些\n留下来的画面。',desc:'从包豪斯到今天，设计史是一座可以反复进入的实验室。',button:'随机案例'},practice:{label:'练习场',title:'先动手，\n再理解。',desc:'短小、直接、立即看到变化。把设计概念变成你的判断力。',button:'开始 30 秒挑战'}}[type]
  useEffect(()=>{
    const controller=new AbortController()
    setState('loading'); setItems([]); setSelected(null)
    fetch('/api/content?type='+(type==='learn'?'lesson':type==='cases'?'case':'exercise'),{signal:controller.signal}).then(r=>{if(!r.ok) throw new Error('load failed');return r.json()}).then(data=>{setItems(data);setState('ready')}).catch(error=>{if(error.name!=='AbortError') setState('error')})
    return()=>controller.abort()
  },[type])
  useEffect(()=>{if(!selected)return;const close=e=>{if(e.key==='Escape')setSelected(null)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[selected])
  const openFeatured=()=>{if(!items.length)return;setSelected(type==='cases'?items[Math.floor(Math.random()*items.length)]:items[0])}
  return <main className="inner-page"><section className="page-hero"><div><Pill>{config.label} / 0{type==='learn'?1:type==='cases'?2:3}</Pill><h1>{config.title.split('\n').map((x,i)=><React.Fragment key={x}>{x}{i===0&&<br/>}</React.Fragment>)}</h1><p>{config.desc}</p></div><div className="page-orbit"><div className="orbit-ring"/><span>↗</span></div></section><div className="content-toolbar"><span className="mono">{state==='loading'?'正在编排…':state==='error'?'内容暂时无法加载':`${items.length} 个单元 · 为你编排`}</span><button className="outline-button" disabled={state!=='ready'||!items.length} onClick={openFeatured}>{config.button} <Arrow/></button></div><section className="content-grid">{state==='error'?<div className="empty-state">连接实验室失败，请刷新页面重试。</div>:items.map((item,i)=><article className={'content-card card-'+item.accent} key={item.id}><div className="card-meta"><span>{item.meta}</span><span>0{i+1}</span></div><div className="card-art"><span className="art-symbol">{type==='learn'?['◒','◈','Aa','▦'][i%4]:type==='cases'?['▦','＋','Aa'][i%3]:'✳'}</span></div><div className="card-body"><h3>{item.title}</h3><h4>{item.subtitle}</h4><p>{item.body}</p><button className="text-link" onClick={()=>setSelected(item)}>打开单元 <Arrow/></button></div></article>)}</section>{selected&&<UnitDialog item={selected} type={type} onClose={()=>setSelected(null)} />}</main>
}

function UnitDialog({item,type,onClose}) {
  const notes={learn:['先观察：画面中什么最先吸引你？','再尝试：只改变一个变量，对比前后差异。'],cases:['先拆解：找出主角、网格与视觉路径。','再思考：如果拿掉一个元素，秩序还成立吗？'],practice:['计时 30 秒，只做一次明确选择。','完成后说出你的主角、对比和阅读顺序。']}[type]
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className={'unit-dialog card-'+item.accent} role="dialog" aria-modal="true" aria-labelledby="unit-title" onMouseDown={e=>e.stopPropagation()}><div className="dialog-top"><Pill>{item.meta}</Pill><button className="icon-button" aria-label="关闭单元" onClick={onClose}>×</button></div><div className="dialog-art"><span>{type==='practice'?'30″':'Aa'}</span></div><div className="dialog-copy"><p className="eyebrow">{type==='learn'?'核心概念':type==='cases'?'案例拆解':'设计挑战'}</p><h2 id="unit-title">{item.title}</h2><h3>{item.subtitle}</h3><p>{item.body}</p><ol><li>{notes[0]}</li><li>{notes[1]}</li></ol><button className="outline-button" onClick={onClose}>{type==='practice'?'完成这次练习':'读完，返回列表'} <Arrow/></button></div></section></div>
}

function Works({go}) {
  const [works,setWorks]=useState([]); const [title,setTitle]=useState(''); const [saved,setSaved]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState('')
  const load=()=>fetch('/api/works').then(r=>{if(!r.ok)throw new Error('load failed');return r.json()}).then(data=>{setWorks(data);setError('')}).catch(()=>setError('作品暂时无法加载，请稍后重试。'))
  useEffect(()=>{ load() },[])
  const save=async()=>{if(saving)return;const cleanTitle=title.trim();if(!cleanTitle){setError('请先为这次实验命名。');return}setSaving(true);setError('');try{const response=await fetch('/api/works',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:cleanTitle,author:'你',tags:'composition · study'})});if(!response.ok)throw new Error('save failed');await response.json();setTitle('');setSaved(true);await load();setTimeout(()=>setSaved(false),1800)}catch{setError('保存失败，请检查连接后重试。')}finally{setSaving(false)}}
  return <main className="inner-page"><section className="page-hero works-hero"><div><Pill>作品墙 / 04</Pill><h1>让实验<br/><i>留下来。</i></h1><p>每一次尝试都值得被看见。保存你的练习，给未来的自己留一张便签。</p></div><div className="sticker">MAKE<br/>SOMETHING<br/><b>VISIBLE</b></div></section><section className="save-box"><div><span className="eyebrow">保存一张新实验</span><h2>这次你在研究什么？</h2></div><div className="save-area"><div className="save-form"><input value={title} maxLength="80" aria-label="作品名称" onChange={e=>{setTitle(e.target.value);setError('')}} onKeyDown={e=>{if(e.key==='Enter')save()}} placeholder="例如：让留白更有重量"/><button disabled={saving} onClick={save}>{saving?'保存中…':saved?'已保存 ✓':'保存作品'} <Arrow/></button></div>{error&&<p className="form-error" role="alert">{error}</p>}</div></section><section className="works-grid">{works.length===0?<div className="empty-state">还没有作品。去练习场完成第一个挑战吧 <button className="text-link" onClick={()=>go('/practice')}>开始练习 <Arrow/></button></div>:works.map((w,i)=><article className={'work-card work-'+(i%4)} key={w.id}><div className="work-visual"><span>{['01','Aa','✳','—'][i%4]}</span></div><div className="work-info"><b>{w.title}</b><span>{w.author} · {new Date(w.created_at).toLocaleDateString('zh-CN')}</span></div></article>)}</section></main>
}

function NotFound({go}) { return <main className="not-found"><Pill>404 / LOST GRID</Pill><h1>这块画布<br/>还没有内容。</h1><button className="outline-button" onClick={()=>go('/')}>返回实验室 <Arrow/></button></main> }

function App(){ const [route,go]=useRoute(); const pages={'/':<Home go={go}/>, '/learn':<ContentPage type="learn" go={go}/>, '/cases':<ContentPage type="cases" go={go}/>, '/practice':<ContentPage type="practice" go={go}/>, '/wall':<Wall go={go}/>, '/works':<Works go={go}/>}; return <><Header go={go} route={route}/>{pages[route]||<NotFound go={go}/>}<footer><span>STUDIO 14</span><span>一个关于观看的学习实验室</span><span className="mono">© 2024—∞</span></footer></> }

export default App
