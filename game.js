// Kanto Nerd — v10 (centralizado + Top 20 + cartas maiores)
// PRODUCTS
const PRODUCTS = [
  { id: 'pikachu',   label: 'Pikachu',            icon: 'pikachu.png' },
  { id: 'charizard', label: 'Charizard',          icon: 'charizard.png' },
  { id: 'agumon',    label: 'Agumon',             icon: 'agumon.png' },
  { id: 'gabumon',   label: 'Gabumon',            icon: 'gabumon.png' },
  { id: 'gon',       label: 'Gon Freecss',        icon: 'gon.png' },
  { id: 'killua',    label: 'Killua Zoldyck',     icon: 'killua.png' },
  { id: 'yuji',      label: 'Yuji Itadori',       icon: 'yuji.png' },
  { id: 'gojo',      label: 'Satoru Gojo',        icon: 'gojo.png' },
  { id: 'goku',      label: 'Goku',               icon: 'goku.png' },
  { id: 'vegeta',    label: 'Vegeta',             icon: 'vegeta.png' },
  { id: 'naruto',    label: 'Naruto Uzumaki',     icon: 'naruto.png' },
  { id: 'luffy',     label: 'Monkey D. Luffy',    icon: 'luffy.png' },
];

// DOM
const board      = document.getElementById('board');
const boardWrap  = document.getElementById('boardWrap');
const hud        = {
  root:  document.getElementById('hud'),
  name:  document.getElementById('hudName'),
  diff:  document.getElementById('hudDiff'),
  time:  document.getElementById('hudTime'),
  moves: document.getElementById('hudMoves')
};
const startBtn   = document.getElementById('start');
const resetAllBtn= document.getElementById('resetAll');
const modal      = document.getElementById('startModal');
const inpName    = document.getElementById('inpName');
const inpDiff    = document.getElementById('inpDiff');
const confirmStart = document.getElementById('confirmStart');
const cancelStart  = document.getElementById('cancelStart');
const winBox     = document.getElementById('win');
const winStats   = document.getElementById('winStats');
const playAgain  = document.getElementById('playAgain');
const lbBody     = document.getElementById('lbBody');

let S = { player:'', diff:'medium', timer:0, tick:null, moves:0, flipped:[], matched:0, deck:[] };
const WRAP = document.querySelector('.wrap');
// Estado robusto / helpers
function newState(player, diff){
  return { player, diff, timer:0, tick:null, moves:0, flipped:[], matched:0, deck:[], busy:false };
}
function startGame(player, diff){
  try{ WRAP.classList.add('ingame'); }catch{}
  // Fecha modal e banner de vitória
  try{ winBox.classList.add('hidden'); }catch{}
  try{ modal.classList.remove('show'); }catch{}
  // Limpa timer e reseta DOM
  stopTimer();
  board.innerHTML='';
  // Novo estado
  S = newState(player, diff);
  hud.name.textContent = 'Jogador: ' + S.player;
  hud.diff.textContent = 'Dificuldade: ' + diffLabel(S.diff);
  hud.time.textContent = 'Tempo: 00:00';
  hud.moves.textContent= 'Movimentos: 0';
  hud.root.hidden = false;
  board.hidden = false;
  // Render
  buildDeck(); renderGrid();
  // Mede após pintar
  requestAnimationFrame(()=> setCardSize());
}


// Utils
const pad = n => String(n).padStart(2,'0');
const fmt = s => `${pad(Math.floor(s/60))}:${pad(s%60)}`;
const shuffle = a => { for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; };
const boardShape = d => d==='easy' ? [4,4] : d==='hard' ? [6,4] : [5,4];
const diffLabel  = d => d==='easy'?'Fácil':d==='hard'?'Difícil':'Médio';
const diffMul    = d => d==='easy'?1.00 : d==='hard'?1.80 : 1.35;
const scoreFor = (d,t,m) => {
  const [c,r]=boardShape(d); const pairs=(c*r)/2; const mul=diffMul(d);
  const base=10000*mul, completion=(pairs*150)*mul, penalty=t*18+m*40;
  return Math.max(0, Math.round(base+completion-penalty));
};

// dimensiona cartas (limite aumentado p/ 320px)
function setCardSize(){
  const [cols,rows]=boardShape(S.diff);
  const gap=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap'))||18;
  const rect=boardWrap.getBoundingClientRect();
  const availW=rect.width - (cols-1)*gap - 4;
  const availH=Math.max(rect.height, window.innerHeight*0.68) - (rows-1)*gap - 4;
  const size=Math.max(120, Math.min(Math.floor(availW/cols), Math.floor(availH/rows), 320));
  document.documentElement.style.setProperty('--card', size+'px');
  board.style.gridTemplateColumns = `repeat(${cols}, var(--card))`;
}

// deck
function pickProducts(pairs){
  const pool = shuffle([...PRODUCTS]);
  const out  = [];
  for (let i=0;i<pairs;i++){
    const p=pool[i % pool.length];
    const salt=Math.floor(i / pool.length);
    out.push({ key:`${p.id}#${salt}`, id:p.id, label:p.label, icon:p.icon });
  }
  return out;
}
function buildDeck(){
  const [cols,rows]=boardShape(S.diff);
  const pairs=(cols*rows)/2;
  const chosen=pickProducts(pairs);
  const doubled=chosen.flatMap(p => ([
    { gid:p.key+'-a', id:p.id, label:p.label, icon:p.icon },
    { gid:p.key+'-b', id:p.id, label:p.label, icon:p.icon },
  ]));
  S.deck=shuffle(doubled);
  setCardSize();
}

// render
function backLogo(){
  const img=document.createElement('img');
  img.className='icon'; img.alt='Kanto Nerd'; img.src='assets/logo_kanto.jpeg';
  img.onerror=()=>{ img.src='assets/icons/kanto-back.svg' };
  return img;
}
function renderGrid(){
  board.innerHTML='';
  S.deck.forEach(card=>{
    const el=document.createElement('div'); el.className='card';
    const inner=document.createElement('div'); inner.className='inner';
    const front=document.createElement('div'); front.className='front face';
    const badge=document.createElement('span'); badge.className='kanto-badge'; badge.textContent='K';
    front.appendChild(backLogo()); front.appendChild(badge);
    const back=document.createElement('div'); back.className='back face';
    const img=document.createElement('img'); img.className='icon'; img.src=`assets/icons/${card.icon}`; img.alt=card.label;
    back.appendChild(img);
    inner.appendChild(front); inner.appendChild(back); el.appendChild(inner);
    el.addEventListener('click',()=>onFlip(el,card.id));
    board.appendChild(el);
  });
}

// jogo
function startTimer(){ stopTimer(); S.tick=setInterval(()=>{ S.timer++; hud.time.textContent='Tempo: '+fmt(S.timer); },1000); }
function stopTimer(){ if(S.tick){ clearInterval(S.tick); S.tick=null; } }
function resetGame(){
  stopTimer(); S.timer=0; S.moves=0; S.flipped=[]; S.matched=0;
  hud.time.textContent='Tempo: 00:00'; hud.moves.textContent='Movimentos: 0';
  winBox.classList.add('hidden'); buildDeck(); renderGrid();
}
function onFlip(el,id){
  if(S.busy) return;
  if(el.classList.contains('flipped') || S.flipped.length===2) return;
  if(S.moves===0 && S.timer===0 && !S.tick) startTimer();
  el.classList.add('flipped'); S.flipped.push({el,id});
  if(S.flipped.length===2){
    S.moves++; hud.moves.textContent='Movimentos: '+S.moves;
    const [a,b]=S.flipped;
    if(a.id===b.id){
      S.flipped=[]; S.matched+=2;
      if(S.matched===S.deck.length){ stopTimer(); onWin(); }
    }else{
      S.busy = true;
      setTimeout(()=>{ a.el.classList.remove('flipped'); b.el.classList.remove('flipped'); S.flipped=[]; S.busy=false; },650);
    }
  }
}

// campeonato
const Memory={easy:[],medium:[],hard:[]};
const KEY = d => `kanto_lb_${d}`;
function safeGet(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb }catch{ return fb } }
function safeSet(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); return true }catch{ return false } }
function getList(d){ const v=safeGet(KEY(d), null); return (v===null)?Memory[d]:v }
function setList(d,list){ if(!safeSet(KEY(d), list)) Memory[d]=list }
function pushScore(rec){
  const list=getList(rec.diff); list.push(rec);
  list.sort((a,b)=>(b.score-a.score)||(a.time-b.time)||(a.moves-b.moves));
  setList(rec.diff, list.slice(0,100));
}
function renderAllLB(){
  const all=[...getList('easy'),...getList('medium'),...getList('hard')];
  lbBody.innerHTML='';
  if(!all.length){ const tr=document.createElement('tr'); tr.innerHTML='<td colspan="7">Sem registros.</td>'; lbBody.appendChild(tr); return; }
  all.sort((a,b)=>(b.score-a.score)||(a.time-b.time)||(a.moves-b.moves));
  all.slice(0,20).forEach((r,i)=>{ // TOP 20
    const when=new Date(r.date).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'});
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${r.name}</td><td>${r.score}</td><td>${fmt(r.time)}</td><td>${r.moves}</td><td>${r.diff}</td><td>${when}</td>`;
    lbBody.appendChild(tr);
  });
}

// vitória
function onWin(){
  const pts=scoreFor(S.diff,S.timer,S.moves);
  const rec={ name:S.player, diff:S.diff, time:S.timer, moves:S.moves, score:pts, date:new Date().toISOString() };
  pushScore(rec);
  winStats.textContent = `${rec.name} fez ${rec.score} pontos — ${fmt(rec.time)} e ${rec.moves} movimentos (${diffLabel(S.diff)}).`;
  winBox.classList.remove('hidden');
  renderAllLB();
}

// modal
const openModal=()=>{ modal.classList.add('show'); try{ inpName.value=localStorage.getItem('kanto_last_name')||'' }catch{} };
const closeModal=()=>{ modal.classList.remove('show') };
startBtn.addEventListener('click', openModal);
cancelStart.addEventListener('click', closeModal);
confirmStart.addEventListener('click', ()=>{
  const name=(inpName.value||'').trim();
  if(!name){ alert('Informe seu nome.'); return; }
  try{ localStorage.setItem('kanto_last_name', name) }catch{}
  const diff = inpDiff.value;
  startGame(name, diff);
});
playAgain.addEventListener('click', ()=>{ try{ winBox.classList.add('hidden'); }catch{} openModal(); });
resetAllBtn.addEventListener('click', ()=>{
  if(confirm('Resetar TODO o campeonato (todas as dificuldades)?')){
    ['easy','medium','hard'].forEach(d=>{ try{ localStorage.removeItem(KEY(d)) }catch{}; Memory[d]=[]; });
    renderAllLB();
  }
});
window.addEventListener('resize', ()=> setCardSize());
renderAllLB();
