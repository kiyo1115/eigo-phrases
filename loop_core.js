// 聞き流しモード 共通部品(チャンク帳・音のかたまり で使用)
// ListenLoop.create(opts) → { render(), stop(), isOn() }
(function(){
  const css = `
  .ll-set{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:14px;}
  .ll-set label{font-size:11px;color:var(--text-dim);display:flex;flex-direction:column;gap:3px;text-align:left;}
  .ll-set select{background:var(--panel2);color:var(--text);border:1px solid var(--amber-deep);border-radius:8px;padding:6px 8px;font-size:13px;}
  .ll-now{text-align:center;}
  .ll-cat{font-size:12px;color:var(--text-dim);}
  .ll-title{font-size:30px;font-weight:800;margin:6px 0 4px;line-height:1.3;}
  .ll-sub{font-size:18px;color:var(--amber);font-weight:700;}
  .ll-meaning{font-size:15px;margin-top:6px;}
  .ll-exs{margin-top:12px;text-align:left;}
  .ll-ex{padding:8px 10px;border-radius:10px;margin-bottom:6px;border:1px solid transparent;}
  .ll-ex.on{border-color:var(--amber);background:rgba(255,140,46,.08);}
  .ll-ex .en{font-size:16px;font-weight:700;line-height:1.45;}
  .ll-ex .jp{font-size:12px;color:var(--text-dim);}
  .ll-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px;}
  .ll-btn{border:none;border-radius:12px;padding:12px 18px;font-size:15px;font-weight:700;cursor:pointer;background:var(--panel2);color:var(--text);border:1px solid var(--amber-deep);}
  .ll-btn.main{background:var(--amber);color:#1a1208;border-color:var(--amber);font-size:18px;padding:14px 26px;}
  .ll-count{font-size:12px;color:var(--text-dim);text-align:center;margin-top:10px;}
  .ll-empty{font-size:13px;color:var(--text-dim);text-align:center;padding:16px 0;}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  let jaVoice = null;
  function loadJa(){ const vs = speechSynthesis.getVoices(); jaVoice = vs.find(v=>v.lang==='ja-JP' && /google|kyoko|o-ren|nanami|online/i.test(v.name)) || vs.find(v=>v.lang==='ja-JP') || vs.find(v=>v.lang && v.lang.startsWith('ja')) || null; }
  loadJa(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', loadJa);
  function defaultEn(){ const vs = speechSynthesis.getVoices(); return vs.find(v=>v.lang==='en-US' && /google|samantha|natural|online/i.test(v.name)) || vs.find(v=>v.lang==='en-US') || vs.find(v=>v.lang && v.lang.startsWith('en')) || null; }
  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const wait = ms => new Promise(r=>setTimeout(r, ms));

  function sayAsync(text, lang, rate, enVoice){
    return new Promise(res=>{
      const t = (text||'').replace(/\[ピー\]/g,'').replace(/〜/g,'').trim(); if (!t) { res(); return; }
      const u = new SpeechSynthesisUtterance(t); u.lang = lang; u.rate = rate;
      if (lang==='ja-JP' && jaVoice) u.voice = jaVoice;
      if (lang==='en-US') { const v = enVoice || defaultEn(); if (v) u.voice = v; }
      let done = false; const fin = ()=>{ if(!done){ done=true; res(); } };
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 2500 + t.length * (lang==='ja-JP'?260:120) / rate);
      speechSynthesis.speak(u);
    });
  }
  // 画面を隠しても間が伸びないよう、聞こえない音を鳴らし続ける
  let keep = null;
  function keepOn(){ try { if (keep) return; const ctx = new (window.AudioContext||window.webkitAudioContext)(); const o = ctx.createOscillator(), g = ctx.createGain(); g.gain.value = 0.0005; o.frequency.value = 30; o.connect(g); g.connect(ctx.destination); o.start(); keep = ctx; } catch(e){} }
  function keepOff(){ try { if (keep) keep.close(); } catch(e){} keep = null; }

  function create(o){
    const DEF = { target:o.targets[0][0], order:'list', ja:'on', exN:'2', rep:'2', rate:'1', gap:'1500' };
    const set = Object.assign({}, DEF);
    try { Object.assign(set, JSON.parse(localStorage.getItem(o.storageKey)||'{}')); } catch(e){}
    let on = false, list = [], idx = 0, token = 0;
    const save = ()=>{ try { localStorage.setItem(o.storageKey, JSON.stringify(set)); } catch(e){} };
    function build(){
      let p = o.getItems(set.target) || [];
      if (set.order==='random') p = p.slice().sort(()=>Math.random()-.5);
      list = p; if (idx >= list.length) idx = 0;
    }
    function sel(k, label, opts){ return '<label>'+label+'<select data-k="'+k+'">'+opts.map(([v,l])=>'<option value="'+v+'"'+(set[k]===v?' selected':'')+'>'+l+'</option>').join('')+'</select></label>'; }
    function nowHtml(it, exI){
      const exs = it.exs.slice(0, +set.exN);
      return (it.cat?'<div class="ll-cat">'+esc(it.cat)+'</div>':'') +
        '<div class="ll-title">'+esc(it.title)+'</div>' + (it.sub?'<div class="ll-sub">'+esc(it.sub)+'</div>':'') +
        (it.meaning?'<div class="ll-meaning">'+esc(it.meaning)+'</div>':'') +
        '<div class="ll-exs">'+exs.map((e,i)=>'<div class="ll-ex'+(i===exI?' on':'')+'"><div class="en">'+(e.html||esc(e.en))+'</div><div class="jp">'+esc(e.jp||'')+'</div></div>').join('')+'</div>';
    }
    function estSec(){ const ex=+set.exN, rep=+set.rep; return ((o.slowChunk?4:2) + (set.ja!=='off'?2:0) + ex*(rep*2.4 + (set.ja==='on'?2:0)) + (+set.gap/1000)*(1+ex)) / (+set.rate); }
    function countText(){ return list.length ? (idx+1)+' / '+list.length+'個 ・ 1周 約'+Math.max(1,Math.round(list.length*estSec()/60))+'分' : ''; }
    function render(){
      build();
      const it = list[idx];
      o.mount.innerHTML =
        '<div class="ll-set">' +
          sel('target','対象',o.targets) +
          sel('order','順番',[['list','並び順'],['random','ランダム']]) +
          sel('ja','日本語',[['on',o.jaOnLabel||'意味と和訳も読む'],['meaning',o.jaMeaningLabel||'意味だけ読む'],['off','英語だけ']]) +
          sel('exN','例文',[['1','1つ'],['2','2つ'],['3','3つ']]) +
          sel('rep','例文の回数',[['1','1回'],['2','2回'],['3','3回']]) +
          sel('rate','速さ',[['0.8','ゆっくり'],['1','ふつう'],['1.15','速い']]) +
          sel('gap','間',[['800','短い'],['1500','ふつう'],['3000','長い(まねして言う)']]) +
        '</div>' +
        '<div class="ll-now" id="'+o.storageKey+'_now">'+(it ? nowHtml(it,-1) : '<div class="ll-empty">対象がありません。対象や絞り込みを変えてください</div>')+'</div>' +
        '<div class="ll-btns"><button class="ll-btn" data-a="prev">⏮</button><button class="ll-btn main" data-a="play">'+(on?'⏸ 一時停止':'▶ 聞き流し開始')+'</button><button class="ll-btn" data-a="next">⏭</button></div>' +
        '<div class="ll-count" id="'+o.storageKey+'_cnt">'+countText()+'</div>';
      o.mount.querySelectorAll('select').forEach(s=>s.onchange=()=>{ set[s.dataset.k]=s.value; save(); if (s.dataset.k==='target'||s.dataset.k==='order') idx=0; restart(); });
      o.mount.querySelector('[data-a="play"]').onclick = ()=> on ? stop() : start();
      o.mount.querySelector('[data-a="next"]').onclick = ()=>{ idx=(idx+1)%Math.max(1,list.length); restart(); };
      o.mount.querySelector('[data-a="prev"]').onclick = ()=>{ idx=(idx-1+list.length)%Math.max(1,list.length); restart(); };
    }
    function restart(){ if (on) { stop(true); start(); } else render(); }
    function start(){
      build(); if (!list.length) { render(); return; }
      on = true; keepOn(); speechSynthesis.cancel(); render();
      const my = ++token;
      const alive = ()=> on && my===token;
      (async ()=>{
        while (alive()) {
          const it = list[idx]; if (!it) break;
          const rate = +set.rate, gap = +set.gap, ev = o.enVoice ? o.enVoice() : null;
          const nowEl = ()=>document.getElementById(o.storageKey+'_now');
          if (nowEl()) nowEl().innerHTML = nowHtml(it,-1);
          if ('mediaSession' in navigator) { try { navigator.mediaSession.metadata = new MediaMetadata({ title: it.title, artist: it.meaning||'', album: o.albumName||'聞き流し' }); } catch(e){} }
          if (o.slowChunk) { await sayAsync(it.sayChunk, 'en-US', 0.7, ev); if (!alive()) return; await wait(500); if (!alive()) return; }
          await sayAsync(it.sayChunk, 'en-US', rate*0.95, ev); if (!alive()) return;
          if (set.ja!=='off' && it.meaningSay) { await wait(300); await sayAsync(it.meaningSay, 'ja-JP', 1.1); if (!alive()) return; }
          await wait(gap); if (!alive()) return;
          const exs = it.exs.slice(0, +set.exN);
          for (let i=0;i<exs.length;i++){
            if (nowEl()) nowEl().innerHTML = nowHtml(it,i);
            for (let r=0;r<+set.rep;r++){ await sayAsync(exs[i].say||exs[i].en, 'en-US', rate, ev); if (!alive()) return; await wait(r<+set.rep-1 ? Math.min(gap,1200) : 400); if (!alive()) return; }
            if (set.ja==='on' && exs[i].jp) { await sayAsync(exs[i].jp, 'ja-JP', 1.15); if (!alive()) return; }
            await wait(gap); if (!alive()) return;
          }
          build(); idx = (idx+1) % Math.max(1,list.length);
          const c = document.getElementById(o.storageKey+'_cnt'); if (c) c.textContent = countText();
        }
      })();
    }
    function stop(silent){ on = false; token++; speechSynthesis.cancel(); keepOff(); if (!silent) render(); }
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', ()=>{ if(!on) start(); });
        navigator.mediaSession.setActionHandler('pause', ()=>{ if(on) stop(); });
        navigator.mediaSession.setActionHandler('nexttrack', ()=>{ idx=(idx+1)%Math.max(1,list.length); restart(); });
        navigator.mediaSession.setActionHandler('previoustrack', ()=>{ idx=(idx-1+list.length)%Math.max(1,list.length); restart(); });
      } catch(e){}
    }
    return { render, stop: ()=>{ if (on) stop(true); }, isOn: ()=>on };
  }
  window.ListenLoop = { create };
})();
