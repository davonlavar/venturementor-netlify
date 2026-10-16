import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUp, Paperclip, Plus, MessageSquare, Compass, ChartNoAxesCombined, Wallet, Scale, Megaphone, Map, BookOpen, Clock3, Menu, X, Sparkles, Download, FileText, Trash2, ChevronDown, Check, PanelLeftClose } from 'lucide-react';
import './styles.css';

const STARTER = {
  id: 'welcome', title: 'New business plan', updatedAt: Date.now(),
  messages: [{ id: 'welcome-msg', role: 'assistant', content: 'Welcome to VentureMentor. Let’s turn your business idea into a practical plan.\n\nTo get started, tell me:\n1. **Your business idea:** What do you want to launch?\n2. **Industry:** What market will you serve?\n3. **Current stage:** Concept, planning, or early execution?\n4. **Top priority:** What do you need the most help with right now?\n\nWe’ll build from where you are, with realistic assumptions and clear next steps.' }]
};
const tools = [
  { title: 'Build a business plan', desc: 'Turn your idea into a clear, structured plan.', icon: FileText, prompt: 'Help me develop a business plan. First assess what you already know about my idea and ask only for missing information. Offer a concise plan or a thorough plan.' },
  { title: 'Research my market', desc: 'Customers, competitors, and demand.', icon: Compass, prompt: 'Help me conduct market research for my business. Identify target customers, competitors, market demand, trends, and practical ways to validate assumptions. Ask for any missing business and location details.' },
  { title: 'Plan my finances', desc: 'Costs, pricing, revenue, and break-even.', icon: Wallet, prompt: 'Help me build a realistic financial plan for my business, including startup costs, operating expenses, pricing, revenue scenarios, cash flow, and break-even. Make assumptions explicit and ask for missing numbers.' },
  { title: 'Legal & setup checklist', desc: 'Explore structure, permits, and operations.', icon: Scale, prompt: 'Create a general legal and administrative startup checklist for my business and location, covering business structure, registration, licensing, taxes, employment responsibilities, and insurance. Explain that requirements need local professional verification.' },
  { title: 'Create a marketing strategy', desc: 'Positioning, channels, and customer growth.', icon: Megaphone, prompt: 'Help me create an industry-specific marketing strategy with a value proposition, customer acquisition channels, retention plan, a starter budget, and measurable 30-day experiments.' },
  { title: 'Map my first 90 days', desc: 'A practical launch roadmap with milestones.', icon: Map, prompt: 'Create a practical 90-day launch roadmap for my business, broken into phases with milestones, deliverables, dependencies, and next actions. Ask for missing details.' },
  { title: 'Find useful resources', desc: 'Funding, tools, and professional support.', icon: BookOpen, prompt: 'Recommend relevant startup funding options, software tools, professional services, and industry associations for my business. Tailor the suggestions to my industry, location, stage, and budget.' },
  { title: 'Review my progress', desc: 'Set priorities for the next 30 days.', icon: Clock3, prompt: 'Let’s do a startup progress check. Ask what milestones I have achieved, challenges I am facing, whether the concept has changed, and what to prioritize over the next 30 days.' }
];
const uid = () => Math.random().toString(36).slice(2, 10);
function formatDate(ts) { return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
function escapeHtml(s) { return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function renderMarkdown(text) {
  let html = escapeHtml(text || '');
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/(?:^|\n)(- .+(?:\n- .+)*)/g, block => '\n<ul>' + block.trim().split('\n').map(x => `<li>${x.slice(2)}</li>`).join('') + '</ul>');
  html = html.replace(/(?:^|\n)(\d+\. .+(?:\n\d+\. .+)*)/g, block => '\n<ol>' + block.trim().split('\n').map(x => `<li>${x.replace(/^\d+\. /,'')}</li>`).join('') + '</ol>');
  html = html.split(/\n{2,}/).map(part => /^\s*<(h\d|ul|ol)/.test(part) ? part : `<p>${part.replace(/\n/g,'<br/>')}</p>`).join('');
  return html;
}
function App() {
  const [chats, setChats] = useState(() => { try { const saved = JSON.parse(localStorage.getItem('vm-chats') || 'null'); return Array.isArray(saved) && saved.length ? saved : [STARTER]; } catch { return [STARTER]; } });
  const [activeId, setActiveId] = useState(() => { try { return localStorage.getItem('vm-active') || 'welcome'; } catch { return 'welcome'; } });
  const [draft, setDraft] = useState(''); const [busy, setBusy] = useState(false); const [sidebarOpen, setSidebarOpen] = useState(true); const [menuOpen, setMenuOpen] = useState(false); const [attached, setAttached] = useState([]); const [scope, setScope] = useState('VentureMentor');
  const bottomRef = useRef(null); const fileRef = useRef(null); const inputRef = useRef(null);
  const active = chats.find(c => c.id === activeId) || chats[0];
  useEffect(() => { try { localStorage.setItem('vm-chats', JSON.stringify(chats)); localStorage.setItem('vm-active', activeId); } catch {} }, [chats, activeId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [active?.messages, busy]);
  const hasUserMessage = active?.messages?.some(m => m.role === 'user');
  const updateChat = (id, fn) => setChats(prev => prev.map(c => c.id === id ? fn(c) : c));
  function newChat() { const c = { id: uid(), title: 'New conversation', updatedAt: Date.now(), messages: [{ id: uid(), role: 'assistant', content: STARTER.messages[0].content }] }; setChats(prev => [c, ...prev]); setActiveId(c.id); setDraft(''); setAttached([]); setMenuOpen(false); }
  function deleteChat(id, e) { e?.stopPropagation(); setChats(prev => { const rest = prev.filter(c => c.id !== id); if (!rest.length) return [STARTER]; return rest; }); if (id === activeId) { const next = chats.find(c => c.id !== id); setActiveId(next?.id || 'welcome'); } }
  function startTool(tool) { setDraft(tool.prompt); inputRef.current?.focus(); }
  async function readFiles(fileList) {
    const next = [];
    for (const file of Array.from(fileList || []).slice(0, 4)) {
      if (file.size > 1_000_000) { next.push({ name: file.name, text: `[File omitted: ${file.name} is larger than 1 MB. Please upload a smaller text-based file.]` }); continue; }
      const ext = file.name.split('.').pop().toLowerCase();
      if (['txt','md','csv','json','html','xml'].includes(ext) || file.type.startsWith('text/')) {
        next.push({ name: file.name, text: (await file.text()).slice(0, 12000) });
      } else next.push({ name: file.name, text: `[File name provided: ${file.name}. This MVP reads text, Markdown, CSV, JSON, HTML, and XML files. For PDF or Word, paste relevant text into the chat.]` });
    }
    setAttached(prev => [...prev, ...next].slice(0, 4));
  }
  async function send(textOverride) {
    const text = (textOverride ?? draft).trim(); if ((!text && !attached.length) || busy) return;
    const fileContext = attached.map(f => `\n\n[Attached file: ${f.name}]\n${f.text}`).join('');
    const userContent = `${text}${fileContext}`.trim(); const userMsg = { id: uid(), role: 'user', content: userContent, displayContent: text || `Please review ${attached.map(f=>f.name).join(', ')}` };
    const previous = active.messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));
    const updatedMessages = [...active.messages, userMsg];
    updateChat(active.id, c => ({ ...c, title: c.messages.some(m => m.role === 'user') ? c.title : (text.slice(0, 34) || 'File review'), updatedAt: Date.now(), messages: updatedMessages }));
    setDraft(''); setAttached([]); setBusy(true);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [...previous, { role: 'user', content: userContent }] }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'The assistant could not respond.');
      updateChat(active.id, c => ({ ...c, updatedAt: Date.now(), messages: [...c.messages, { id: uid(), role: 'assistant', content: data.reply }] }));
    } catch (err) {
      updateChat(active.id, c => ({ ...c, messages: [...c.messages, { id: uid(), role: 'assistant', error: true, content: `I couldn’t connect to the AI service. ${err.message}\n\nIf this is your first deployment, add your OPENAI_API_KEY in Netlify → Site configuration → Environment variables, then redeploy.` }] }));
    } finally { setBusy(false); }
  }
  function exportPlan(kind) {
    const content = active.messages.map(m => `${m.role === 'assistant' ? 'VentureMentor' : 'You'}\n${m.content}\n`).join('\n');
    if (kind === 'txt') { const blob = new Blob([`${active.title}\n${'='.repeat(active.title.length)}\n\n${content}`], { type: 'text/plain;charset=utf-8' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${active.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase() || 'venturementor-plan'}.txt`; a.click(); URL.revokeObjectURL(a.href); }
    if (kind === 'pdf') window.print();
    if (kind === 'doc') { const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(active.title)}</title></head><body><h1>${escapeHtml(active.title)}</h1>${active.messages.map(m => `<h2>${m.role === 'assistant' ? 'VentureMentor' : 'Founder'}</h2><div>${renderMarkdown(m.content)}</div>`).join('')}</body></html>`; const blob = new Blob(['\ufeff', html], { type: 'application/msword' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${active.title.replace(/[^a-z0-9]+/gi,'-').toLowerCase() || 'venturementor-plan'}.doc`; a.click(); URL.revokeObjectURL(a.href); }
    setMenuOpen(false);
  }
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'} ${menuOpen ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={19}/></div>{sidebarOpen && <div><div className="brand-name">venture<span>mentor</span></div><div className="brand-sub">YOUR AI STARTUP PARTNER</div></div>}<button className="icon-btn sidebar-toggle" onClick={() => setSidebarOpen(v=>!v)} aria-label="Toggle sidebar"><PanelLeftClose size={17}/></button></div>
      <button className="new-chat" onClick={newChat}><Plus size={17}/>{sidebarOpen && 'New conversation'}<span className="shortcut">⌘ K</span></button>
      {sidebarOpen && <><div className="side-label">WORKSPACE</div><button className="side-link selected" onClick={()=>setScope('VentureMentor')}><MessageSquare size={17}/> AI Business Mentor</button><div className="history-head"><span>RECENT CONVERSATIONS</span><span>{chats.length}</span></div><div className="chat-history">{chats.map(c=><button key={c.id} className={`history-item ${active.id===c.id?'active':''}`} onClick={()=>{setActiveId(c.id);setMenuOpen(false)}}><MessageSquare size={15}/><span className="history-title">{c.title}</span><span className="history-date">{formatDate(c.updatedAt)}</span><span className="delete-chat" onClick={e=>deleteChat(c.id,e)} title="Delete conversation"><Trash2 size={13}/></span></button>)}</div><div className="sidebar-bottom"><div className="plan-card"><div className="plan-icon"><Sparkles size={16}/></div><div><strong>Founder mode</strong><p>Big vision. Clear next steps.</p></div></div><div className="user-row"><div className="avatar">VM</div><div className="user-meta"><strong>Venture Founder</strong><span>Local workspace</span></div><ChevronDown size={15}/></div></div></>}
    </aside>
    <main className="main-panel">
      <header className="topbar"><div className="top-left"><button className="mobile-menu icon-btn" onClick={()=>setSidebarOpen(v=>!v)} aria-label="Open menu"><Menu size={20}/></button><span className="top-context"><span className="status-dot"></span> AI BUSINESS MENTOR</span><span className="top-divider">/</span><span className="top-current">{active.title}</span></div><div className="top-actions"><span className="model-chip"><span className="model-dot"></span> Mentor AI <ChevronDown size={13}/></span><button className="export-btn" onClick={()=>setMenuOpen(v=>!v)}><Download size={15}/> Export <ChevronDown size={13}/></button>{menuOpen && <div className="export-menu"><button onClick={()=>exportPlan('txt')}><FileText size={15}/> Download as text</button><button onClick={()=>exportPlan('doc')}><FileText size={15}/> Download Word-compatible .doc</button><button onClick={()=>exportPlan('pdf')}><Download size={15}/> Print / save as PDF</button></div>}</div></header>
      <section className="conversation-area">
        {!hasUserMessage ? <div className="welcome-wrap"><div className="eyebrow"><span className="eyebrow-line"></span> YOUR BUSINESS STARTS HERE <span className="eyebrow-line"></span></div><div className="hero-symbol"><div className="hero-orbit orbit-one"></div><div className="hero-orbit orbit-two"></div><div className="hero-core"><Sparkles size={27}/></div><span className="orbit-dot dot-one"></span><span className="orbit-dot dot-two"></span></div><h1>Build something <em>remarkable.</em></h1><p className="hero-sub">Your ideas deserve a real plan. Get practical guidance on launching, growing, and running a business, one clear step at a time.</p><div className="welcome-prompt"><div className="prompt-avatar"><Sparkles size={17}/></div><div><strong>Let’s start with your vision.</strong><p>Tell me about your idea, your industry, where you are in the journey, and what you need help with most.</p></div></div><div className="tools-heading"><div><span className="section-kicker">YOUR STARTUP TOOLKIT</span><h2>What are we working on today?</h2></div><span className="tools-count">08 TOOLS</span></div><div className="tools-grid">{tools.map((tool,i)=>{const Icon=tool.icon;return <button className="tool-card" key={tool.title} onClick={()=>startTool(tool)}><span className={`tool-icon tone-${i}`}><Icon size={18}/></span><span className="tool-copy"><strong>{tool.title}</strong><span>{tool.desc}</span></span><span className="tool-arrow">↗</span></button>})}</div></div> : <div className="messages-wrap">{active.messages.map(m=><div className={`message-row ${m.role}`} key={m.id}><div className={`message-avatar ${m.role}`}>{m.role==='assistant'?<Sparkles size={16}/>:<span>Y</span>}</div><div className="message-content"><div className="message-author">{m.role==='assistant'?'VentureMentor':'You'} <span>{m.role==='assistant'?'AI business advisor':'Founder'}</span></div><div className={`message-bubble ${m.error?'error':''}`} dangerouslySetInnerHTML={{__html:renderMarkdown(m.displayContent || m.content)}}/></div></div>)}{busy && <div className="message-row assistant"><div className="message-avatar assistant"><Sparkles size={16}/></div><div className="message-content"><div className="message-author">VentureMentor <span>AI business advisor</span></div><div className="typing"><i></i><i></i><i></i><span>Thinking through your next move…</span></div></div></div>}<div ref={bottomRef}/></div>}
      </section>
      <footer className="composer-area"><div className="composer-box"><div className="attachment-list">{attached.map((f,i)=><span className="attachment-chip" key={i}><FileText size={13}/>{f.name}<button onClick={()=>setAttached(prev=>prev.filter((_,j)=>j!==i))} aria-label="Remove file"><X size={12}/></button></span>)}</div><textarea ref={inputRef} rows={1} value={draft} placeholder="Tell me about your business idea…" onChange={e=>{setDraft(e.target.value);e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,140)+'px'}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}/><div className="composer-bottom"><div className="composer-tools"><button className="attach-btn" onClick={()=>fileRef.current?.click()}><Paperclip size={16}/><span>Attach files</span></button><input ref={fileRef} type="file" hidden multiple accept=".txt,.md,.csv,.json,.html,.xml,text/*,.pdf,.doc,.docx" onChange={e=>{readFiles(e.target.files);e.target.value=''}}/><span className="composer-hint">Specific details lead to better plans.</span></div><button className="send-btn" disabled={busy||(!draft.trim()&&!attached.length)} onClick={()=>send()} aria-label="Send message">{busy?'…':<ArrowUp size={19}/>}</button></div></div><div className="fine-print">VentureMentor can make mistakes. Verify important legal, tax, and financial decisions with qualified professionals.</div></footer>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App/>);
