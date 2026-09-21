import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
function snakeHTML(style: string){
  const neon = style==="neon";
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;box-sizing:border-box}body{background:${neon?"#020617":"#070b16"};color:#eaf0ff;font-family:Inter,system-ui;display:grid;place-items:center;min-height:100vh}
.wrap{display:flex;flex-direction:column;align-items:center;gap:12px}
canvas{background:${neon?"#0f172a":"#0e152b"};border-radius:16px;box-shadow:0 20px 60px #0008,0 0 0 1px #ffffff14;touch-action:none}
.hud{display:flex;gap:12px;align-items:center;font-weight:700}
.btn{padding:8px 14px;border-radius:999px;border:1px solid #ffffff18;background:#ffffff0f;color:#fff;cursor:pointer}
.score{font-size:18px}
</style></head><body><div class="wrap"><div class="hud"><span class="score" id="score">Score 0</span><button class="btn" onclick="reset()">Restart</button></div><canvas id="c" width="360" height="360"></canvas><div style="opacity:.6;font-size:12px">Arrow / WASD / Swipe</div></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d'),N=18,S=360/N;
let dir={x:1,y:0},next={x:1,y:0},snake=[{x:9,y:9}],food={x:14,y:10},score=0,over=false,t=0;
function rnd(){return {x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}
function place(){let p=rnd();while(snake.some(s=>s.x===p.x&&s.y===p.y))p=rnd();food=p}
place();
function reset(){snake=[{x:9,y:9}];dir={x:1,y:0};next={x:1,y:0};score=0;over=false;document.getElementById('score').textContent='Score 0'}
function step(){
 if(over)return;
 dir=next;
 let h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
 if(h.x<0)h.x=N-1;if(h.x>=N)h.x=0;if(h.y<0)h.y=N-1;if(h.y>=N)h.y=0;
 if(snake.some(s=>s.x===h.x&&s.y===h.y)){over=true;return}
 snake.unshift(h);
 if(h.x===food.x&&h.y===food.y){score+=10;document.getElementById('score').textContent='Score '+score;place()} else snake.pop();
}
function draw(){
 x.clearRect(0,0,360,360);
 x.fillStyle="#22d3ee22";for(let i=0;i<N;i++){x.fillRect(i*S,0,1,360);x.fillRect(0,i*S,360,1)}
 x.fillStyle="#f59e0b";x.fillRect(food.x*S+2,food.y*S+2,S-4,S-4);
 snake.forEach((s,i)=>{x.fillStyle=i===0?"#6c8cff":"#22d3ee";x.fillRect(s.x*S+1,s.y*S+1,S-2,S-2)});
 if(over){x.fillStyle="#0008";x.fillRect(0,0,360,360);x.fillStyle="#fff";x.font="700 22px system-ui";x.textAlign="center";x.fillText("Game Over",180,175);x.font="13px system-ui";x.fillText("Press Restart",180,195)}
}
function loop(ts){ if(!t||ts-t>90){t=ts;step();draw()} requestAnimationFrame(loop)}
addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if((k==="arrowup"||k==="w")&&dir.y===0)next={x:0,y:-1};
 if((k==="arrowdown"||k==="s")&&dir.y===0)next={x:0,y:1};
 if((k==="arrowleft"||k==="a")&&dir.x===0)next={x:-1,y:0};
 if((k==="arrowright"||k==="d")&&dir.x===0)next={x:1,y:0};
});
let sx=0,sy=0;c.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY});
c.addEventListener('touchend',e=>{let dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.abs(dx)>Math.abs(dy)){if(dx>0&&dir.x===0)next={x:1,y:0};if(dx<0&&dir.x===0)next={x:-1,y:0}}else{if(dy>0&&dir.y===0)next={x:0,y:1};if(dy<0&&dir.y===0)next={x:0,y:-1}}});
requestAnimationFrame(loop);
</script></body></html>`;
}
function flappyHTML(){
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;box-sizing:border-box}body{background:#070b16;color:#fff;font-family:system-ui;display:grid;place-items:center;min-height:100vh}
canvas{background:linear-gradient(#0ea5e9,#6c8cff);border-radius:18px;box-shadow:0 20px 60px #0008}
.hud{position:absolute;top:12px;left:50%;transform:translateX(-50%);font:800 22px system-ui;text-shadow:0 2px 8px #000}
.wrap{position:relative}
</style></head><body><div class="wrap"><canvas id="c" width="360" height="520"></canvas><div class="hud" id="hud">0</div></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let y=250,vy=0,g=0.45,score=0,over=false,pipes=[],t=0;
function reset(){y=250;vy=0;score=0;over=false;pipes=[];hud.textContent=0}
function addPipe(){let h=80+Math.random()*180; pipes.push({x:360,h,passed:false})}
c.addEventListener('click',()=>{if(over)reset();vy=-7});
addEventListener('keydown',e=>{if(e.code==="Space"){if(over)reset();vy=-7}});
function loop(){
 x.clearRect(0,0,360,520);
 if(!over){vy+=g;y+=vy; if(y<0)y=0; if(y>500){over=true}}
 if(t%90===0&&!over)addPipe();
 pipes.forEach(p=>{if(!over)p.x-=2.2; x.fillStyle="#0f172a"; x.fillRect(p.x,0,36,p.h); x.fillRect(p.x,p.h+110,36,520); if(!p.passed&&p.x<80){p.passed=true;score++;hud.textContent=score}});
 pipes=pipes.filter(p=>p.x>-40);
 x.fillStyle="#fde047"; x.beginPath(); x.arc(80,y,12,0,Math.PI*2); x.fill(); x.fillStyle="#fff"; x.beginPath(); x.arc(84,y-4,3,0,Math.PI*2); x.fill();
 if(over){x.fillStyle="#0007";x.fillRect(0,0,360,520);x.fillStyle="#fff";x.font="800 22px system-ui";x.textAlign="center";x.fillText("Game Over",180,240);x.font="13px system-ui";x.fillText("Click / Space to restart",180,260)}
 t++; requestAnimationFrame(loop)
}
loop();
</script></body></html>`;
}
function pongHTML(){
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#020617;display:grid;place-items:center;min-height:100vh}canvas{background:#0f172a;border-radius:16px}</style></head><body><canvas id="c" width="560" height="360"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let py=140,oy=140,by=180,bx=280,bvx=3,bvy=2,ps=0,os=0;
c.addEventListener('mousemove',e=>{let r=c.getBoundingClientRect();py=(e.clientY-r.top)-40});
c.addEventListener('touchmove',e=>{let r=c.getBoundingClientRect();py=(e.touches[0].clientY-r.top)-40; e.preventDefault()},{passive:false});
function loop(){
 x.clearRect(0,0,560,360);
 x.fillStyle="#ffffff0f"; for(let i=0;i<360;i+=16){x.fillRect(279,i,2,8)}
 x.fillStyle="#6c8cff"; x.fillRect(12,py,10,80);
 x.fillStyle="#22d3ee"; x.fillRect(538,oy,10,80);
 x.fillStyle="#fff"; x.beginPath(); x.arc(bx,by,8,0,Math.PI*2); x.fill();
 bx+=bvx; by+=bvy;
 if(by<8||by>352)bvy*=-1;
 if(bx<22&&by>py&&by<py+80){bvx*=-1; bx=22}
 if(bx>528&&by>oy&&by<oy+80){bvx*=-1; bx=528}
 if(bx<0){os++; bx=280;by=180;bvx=3}
 if(bx>560){ps++; bx=280;by=180;bvx=-3}
 oy+=(by-oy-40)*0.06;
 x.fillStyle="#fff"; x.font="800 20px system-ui"; x.fillText(ps,240,30); x.fillText(os,320,30);
 requestAnimationFrame(loop)
}
loop();
</script></body></html>`;
}
function breakoutHTML(){
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#070b16;display:grid;place-items:center;min-height:100vh}canvas{background:#0e152b;border-radius:16px}</style></head><body><canvas id="c" width="360" height="420"></canvas>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');
let px=150,ball={x:180,y:300,vx:2.5,vy:-3},bricks=[],score=0;
for(let r=0;r<4;r++)for(let col=0;col<6;col++)bricks.push({x:12+col*56,y:40+r*22,w:50,h:16,alive:true, c: r===0?"#6c8cff":r===1?"#22d3ee":r===2?"#a855f7":"#f59e0b"});
c.addEventListener('mousemove',e=>{let r=c.getBoundingClientRect();px=(e.clientX-r.left)-40});
c.addEventListener('touchmove',e=>{let r=c.getBoundingClientRect();px=(e.touches[0].clientX-r.left)-40},{passive:false});
function loop(){
 x.clearRect(0,0,360,420);
 bricks.forEach(b=>{if(!b.alive)return; x.fillStyle=b.c; x.fillRect(b.x,b.y,b.w,b.h)});
 x.fillStyle="#fff"; x.fillRect(px,400,80,10);
 x.fillStyle="#fde047"; x.beginPath(); x.arc(ball.x,ball.y,7,0,Math.PI*2); x.fill();
 ball.x+=ball.vx; ball.y+=ball.vy;
 if(ball.x<7||ball.x>353)ball.vx*=-1;
 if(ball.y<7)ball.vy*=-1;
 if(ball.y>393&&ball.x>px&&ball.x<px+80)ball.vy=-Math.abs(ball.vy);
 bricks.forEach(b=>{if(!b.alive)return; if(ball.x>b.x&&ball.x<b.x+b.w&&ball.y>b.y&&ball.y<b.y+b.h){b.alive=false; ball.vy*=-1; score+=10}});
 if(ball.y>420){ball.x=180;ball.y=300;ball.vx=2.5;ball.vy=-3}
 if(bricks.every(b=>!b.alive)){x.fillStyle="#fff";x.font="800 18px system-ui";x.textAlign="center";x.fillText("You Win! "+score,180,210)}
 requestAnimationFrame(loop)
}
loop();
</script></body></html>`;
}
function genericHTML(prompt: string){
  const safe = prompt.slice(0,120).replace(/</g,"&lt;");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{margin:0;box-sizing:border-box}body{background:#070b16;color:#eaf0ff;font-family:system-ui;display:grid;place-items:center;min-height:100vh;padding:16px}
.card{background:#0e152b;border:1px solid #ffffff14;border-radius:20px;padding:18px;max-width:520px;width:100%;box-shadow:0 20px 60px #0006}
canvas{width:100%;height:220px;background:#020617;border-radius:14px;display:block}
h1{font-size:18px;margin:10px 0 6px} p{opacity:.7;font-size:13px;line-height:1.5}
.btn{margin-top:10px;padding:10px 14px;border-radius:999px;border:0;background:linear-gradient(90deg,#6c8cff,#22d3ee);color:#fff;font-weight:700;cursor:pointer;width:100%}
</style></head><body><div class="card"><canvas id="c"></canvas><h1>${safe}</h1><p>Tap / Click to interact. Use a prompt like "snake" "flappy" "pong" "breakout" for a full game.</p><button class="btn" onclick="burst()">Interact</button></div>
<script>
const c=document.getElementById('c'),x=c.getContext('2d');let w=c.width=520,h=c.height=220;
let pts=[];
function burst(){for(let i=0;i<20;i++)pts.push({x:w/2,y:h/2,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8,r:3+Math.random()*4,c: "hsl("+(200+Math.random()*60)+",90%,60%)",a:1})}
function loop(){
 x.clearRect(0,0,w,h);
 pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.25;p.a-=0.012; x.globalAlpha=Math.max(0,p.a); x.fillStyle=p.c; x.beginPath(); x.arc(p.x,p.y,p.r,0,Math.PI*2); x.fill()});
 pts=pts.filter(p=>p.a>0);
 x.globalAlpha=1;
 x.fillStyle="#ffffff0f"; x.font="700 22px system-ui"; x.textAlign="center"; x.fillText("PLAY",w/2,h/2+6);
 requestAnimationFrame(loop)
}
c.addEventListener('click',burst);
c.addEventListener('touchstart',burst);
loop();
</script></body></html>`;
}
export async function POST(req: Request){
  try{
    const { prompt="", template="", style="neon" } = await req.json().catch(()=>({}));
    const p = String(prompt||template||"").toLowerCase();
    let html="";
    if(p.includes("snake")) html=snakeHTML(style);
    else if(p.includes("flappy")||p.includes("bird")) html=flappyHTML();
    else if(p.includes("pong")) html=pongHTML();
    else if(p.includes("breakout")||p.includes("brick")||p.includes("arkanoid")) html=breakoutHTML();
    else html=genericHTML(prompt || "Cool Game");
    return NextResponse.json({ ok:true, html, name:"index.html", size: html.length });
  }catch(e){ return NextResponse.json({ error: String(e) }, {status:500})}
}
export async function GET(){ return NextResponse.json({ ok:true, service:"dev-generate", templates:["snake","flappy","pong","breakout","generic"]});}
