const canvas=document.getElementById("gameCanvas"),ctx=canvas.getContext("2d");
let W=window.innerWidth,H=window.innerHeight,dpr=1;
const input={left:false,right:false,jump:false};
let game=null;

function resizeCanvas(){
  dpr=Math.min(window.devicePixelRatio||1,2); W=window.innerWidth; H=window.innerHeight;
  canvas.width=Math.floor(W*dpr); canvas.height=Math.floor(H*dpr); canvas.style.width=W+"px"; canvas.style.height=H+"px";
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize",resizeCanvas); resizeCanvas();

function rand(a,b){return Math.random()*(b-a)+a}
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function formatTime(sec){sec=Math.floor(sec);return String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0")}
function chooseQuestion(){
  const diff=game.distance<500?"Fácil":game.distance<1500?"Médio":"Difícil";
  let pool=QUESTIONS.filter(q=>q.dificuldade===diff && !game.usedQuestions.has(q.pergunta));
  if(!pool.length){game.usedQuestions.clear();pool=QUESTIONS.filter(q=>q.dificuldade===diff)}
  const q=pool[Math.floor(Math.random()*pool.length)]; game.usedQuestions.add(q.pergunta); return q;
}

function makePlayer(){return {x:W*.28,y:H*.62,w:42,h:58,vx:0,vy:0,onGround:false,speed:4.4,jump:-13,runFrame:0}}
function makeObstacle(x){
  const type=Math.random()<.25?"flying":Math.random()<.35?"spike":"box";
  const h=type==="spike"?34:type==="flying"?35:46, w=type==="flying"?55:type==="spike"?50:48;
  return {x,y:type==="flying"?H*.38:H*.74-h,w,h,type,passed:false};
}
function resetGame(){
  game={
    state:"PLAYING",player:makePlayer(),obstacles:[],particles:[],cameraX:0,worldX:0,
    score:0,distance:0,time:0,lives:3,combo:0,maxCombo:0,correct:0,wrong:0,
    speed:4.4,spawnTimer:0,groundY:H*.74,usedQuestions:new Set(),last:performance.now(),
    questionObstacle:null,warning:false
  };
  for(let i=0;i<5;i++) game.obstacles.push(makeObstacle(W+250+i*260));
  updateHUD(); requestAnimationFrame(loop);
}
function startGame(){document.getElementById("menu").classList.add("hidden");document.getElementById("gameScreen").classList.remove("hidden");hideAllOverlays();resetGame()}
function endGame(reason){
  if(!game||game.state==="GAME_OVER")return;
  game.state="GAME_OVER";
  document.getElementById("gameOverReason").textContent=reason;
  document.getElementById("finalScore").textContent=Math.floor(game.score).toLocaleString("pt-BR");
  document.getElementById("finalDistance").textContent=Math.floor(game.distance)+" m";
  document.getElementById("finalTime").textContent=formatTime(game.time);
  document.getElementById("finalCorrect").textContent=game.correct;
  document.getElementById("finalCombo").textContent="x"+game.maxCombo;
  saveRecords(); document.getElementById("gameOverModal").classList.remove("hidden");
}
function update(dt){
  if(game.state!=="PLAYING")return;
  game.time+=dt; game.speed=Math.min(9,4.4+game.distance*.0018);
  const p=game.player;
  let target=game.speed;
  if(input.left)target-=2.6;if(input.right)target+=2;
  p.vx+=(target-p.vx)*Math.min(1,dt*8); p.vx=clamp(p.vx,1.2,10);
  if(input.jump&&p.onGround){p.vy=p.jump;p.onGround=false;input.jump=false}
  p.vy+=30*dt;p.y+=p.vy;
  const floor=game.groundY-p.h;
  if(p.y>=floor){p.y=floor;p.vy=0;p.onGround=true}
  game.worldX+=game.speed*60*dt; game.distance=game.worldX/10;
  game.cameraX=game.worldX;
  game.spawnTimer-=dt;
  if(game.spawnTimer<=0){
    const last=game.obstacles[game.obstacles.length-1];
    const gap=rand(220,390)+(game.speed-4)*15;
    const x=Math.max(W+80,last?last.x+last.w+gap:W+100);
    game.obstacles.push(makeObstacle(x));game.spawnTimer=rand(.7,1.25);
  }
  for(const o of game.obstacles)o.x-=game.speed*60*dt;
  game.obstacles=game.obstacles.filter(o=>o.x>-150);
  for(const o of game.obstacles){
    if(!o.passed&&o.x+o.w<p.x){o.passed=true;game.score+=10}
    if(rectHit(p,o)){openQuestion(o);break}
  }
  const danger=W*.14;
  game.warning=p.x<danger;
  document.getElementById("warning").classList.toggle("show",game.warning);
  if(p.x<0)endGame("A câmera alcançou o personagem.");
  game.score+=dt*game.speed*2;
  game.combo=Math.max(0,game.combo);
  updateHUD();
}
function rectHit(a,b){
  const pad=7;
  return a.x+pad<b.x+b.w&&a.x+a.w-pad>b.x&&a.y+pad<b.y+b.h&&a.y+a.h-pad>b.y;
}
function draw(){
  ctx.clearRect(0,0,W,H);
  drawBackground();
  drawGround();
  for(const o of game.obstacles)drawObstacle(o);
  drawPlayer(game.player);
}
function drawBackground(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#101a3a");g.addColorStop(.65,"#264a61");g.addColorStop(1,"#15251d");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle="#ffffff22";
  for(let i=0;i<55;i++){let x=(i*173-game.worldX*.08)%W;if(x<0)x+=W;let y=(i*71)%Math.max(150,H*.5);ctx.fillRect(x,y,2,2)}
  // distant mountains
  ctx.fillStyle="#172c3c";ctx.beginPath();ctx.moveTo(0,H*.55);
  for(let x=0;x<=W+100;x+=100)ctx.lineTo(x,H*.55-rand(30,130));ctx.lineTo(W,H*.74);ctx.lineTo(0,H*.74);ctx.fill();
  // trees
  for(let i=-1;i<10;i++){let x=(i*180-game.worldX*.22)% (W+220);if(x<-100)x+=W+220;drawTree(x,H*.62)}
}
function drawTree(x,y){ctx.fillStyle="#4a2f1c";ctx.fillRect(x-7,y-70,14,70);ctx.fillStyle="#173f2b";ctx.beginPath();ctx.arc(x,y-78,38,0,Math.PI*2);ctx.fill();ctx.fillStyle="#245b36";ctx.beginPath();ctx.arc(x+25,y-58,25,0,Math.PI*2);ctx.fill()}
function drawGround(){
  ctx.fillStyle="#162719";ctx.fillRect(0,game.groundY,W,H-game.groundY);
  ctx.fillStyle="#3e6b35";ctx.fillRect(0,game.groundY-7,W,7);
  for(let x=0;x<W;x+=38){ctx.fillStyle="#29452b";ctx.fillRect(x,game.groundY+18+(x%3)*8,24,7)}
}
function drawObstacle(o){
  if(o.type==="box"){ctx.fillStyle="#a66a32";ctx.fillRect(o.x,o.y,o.w,o.h);ctx.strokeStyle="#e2a25c";ctx.lineWidth=3;ctx.strokeRect(o.x+2,o.y+2,o.w-4,o.h-4);ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(o.x+o.w,o.y+o.h);ctx.moveTo(o.x+o.w,o.y);ctx.lineTo(o.x,o.y+o.h);ctx.stroke()}
  else if(o.type==="spike"){ctx.fillStyle="#e5e7eb";ctx.beginPath();ctx.moveTo(o.x,o.y+o.h);ctx.lineTo(o.x+o.w/2,o.y);ctx.lineTo(o.x+o.w,o.y+o.h);ctx.closePath();ctx.fill();ctx.fillStyle="#64748b";ctx.fillRect(o.x,o.y+o.h-7,o.w,7)}
  else{ctx.fillStyle="#7c3aed";ctx.beginPath();ctx.roundRect(o.x,o.y,o.w,o.h,12);ctx.fill();ctx.fillStyle="#facc15";ctx.beginPath();ctx.arc(o.x+15,o.y+16,5,0,Math.PI*2);ctx.arc(o.x+40,o.y+16,5,0,Math.PI*2);ctx.fill()}
}
function drawPlayer(p){
  p.runFrame+=.2;
  ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);
  // shadow
  ctx.restore();ctx.fillStyle="#0006";ctx.beginPath();ctx.ellipse(p.x+p.w/2,game.groundY+4,25,7,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(p.x,p.y);
  ctx.fillStyle="#2563eb";ctx.beginPath();ctx.roundRect(7,17,28,35,9);ctx.fill();
  ctx.fillStyle="#f2b78d";ctx.beginPath();ctx.arc(21,14,14,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#111827";ctx.beginPath();ctx.arc(16,12,2,0,Math.PI*2);ctx.arc(26,12,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#facc15";ctx.fillRect(8,35,26,5);
  ctx.fillStyle="#111827";let leg=Math.sin(p.runFrame)*5;ctx.fillRect(10,49,8,8+leg);ctx.fillRect(25,49,8,8-leg);
  ctx.restore();
}
function loop(now){
  if(!game)return;const dt=Math.min((now-game.last)/1000,.035);game.last=now;
  update(dt);draw();
  if(game.state==="PLAYING")requestAnimationFrame(loop);
}
function openQuestion(obstacle){
  if(game.state!=="PLAYING")return;
  game.state="QUESTION";game.questionObstacle=obstacle;
  const q=chooseQuestion();game.currentQuestion=q;
  document.getElementById("questionSubject").textContent=q.materia.toUpperCase();
  document.getElementById("questionDifficulty").textContent=q.dificuldade.toUpperCase();
  document.getElementById("questionText").textContent=q.pergunta;
  const box=document.getElementById("answers");box.innerHTML="";
  document.getElementById("questionFeedback").textContent="";
  q.alternativas.forEach((a,i)=>{const b=document.createElement("button");b.className="answer";b.textContent=String.fromCharCode(65+i)+") "+a;b.onclick=()=>answerQuestion(i,b);box.appendChild(b)});
  document.getElementById("questionModal").classList.remove("hidden");
}
function answerQuestion(i,button){
  if(game.state!=="QUESTION")return;
  const q=game.currentQuestion,buttons=[...document.querySelectorAll(".answer")];
  buttons.forEach(b=>b.disabled=true);
  if(i===q.resposta){
    button.classList.add("correct");game.correct++;game.combo++;game.maxCombo=Math.max(game.maxCombo,game.combo);
    const mult=Math.max(1,game.combo);game.score+=100*mult;
    document.getElementById("questionFeedback").textContent="✓ CORRETO! +"+(100*mult)+" pontos";
    document.getElementById("questionFeedback").style.color="#4ade80";
    setTimeout(resumeAfterQuestion,650);
  }else{
    button.classList.add("wrong");buttons[q.resposta].classList.add("correct");game.wrong++;game.lives--;game.combo=0;
    document.getElementById("questionFeedback").textContent="✕ ERRADO! "+q.explicacao;
    document.getElementById("questionFeedback").style.color="#f87171";updateHUD();
    setTimeout(()=>{if(game.lives<=0){document.getElementById("questionModal").classList.add("hidden");endGame("Você perdeu todas as vidas.")}else resumeAfterQuestion()},1300);
  }
}
function resumeAfterQuestion(){
  if(!game||game.state!=="QUESTION")return;
  if(game.questionObstacle){const idx=game.obstacles.indexOf(game.questionObstacle);if(idx>=0)game.obstacles.splice(idx,1)}
  document.getElementById("questionModal").classList.add("hidden");game.questionObstacle=null;game.state="PLAYING";game.last=performance.now();requestAnimationFrame(loop);
}
function updateHUD(){
  if(!game)return;
  document.getElementById("score").textContent=Math.floor(game.score).toLocaleString("pt-BR");
  document.getElementById("distance").textContent=Math.floor(game.distance).toLocaleString("pt-BR");
  document.getElementById("time").textContent=formatTime(game.time);
  document.getElementById("combo").textContent="COMBO x"+game.combo;
  document.getElementById("lives").textContent="❤️".repeat(game.lives)+"🖤".repeat(3-game.lives);
}
function saveRecords(){
  const old=JSON.parse(localStorage.getItem("tesouroRecords")||"{}");
  const r={score:Math.max(old.score||0,Math.floor(game.score)),distance:Math.max(old.distance||0,Math.floor(game.distance)),time:Math.max(old.time||0,Math.floor(game.time)),combo:Math.max(old.combo||0,game.maxCombo),correct:Math.max(old.correct||0,game.correct)};
  localStorage.setItem("tesouroRecords",JSON.stringify(r));
}
function getRecords(){return JSON.parse(localStorage.getItem("tesouroRecords")||'{"score":0,"distance":0,"time":0,"combo":0,"correct":0}')}
function pauseGame(){if(!game||game.state!=="PLAYING")return;game.state="PAUSED";document.getElementById("pauseModal").classList.remove("hidden")}
function resumeGame(){if(!game||game.state!=="PAUSED")return;game.state="PLAYING";game.last=performance.now();document.getElementById("pauseModal").classList.add("hidden");requestAnimationFrame(loop)}
function quitGame(){game=null;hideAllOverlays();document.getElementById("gameScreen").classList.add("hidden");document.getElementById("menu").classList.remove("hidden")}
function hideAllOverlays(){document.querySelectorAll(".overlay").forEach(x=>x.classList.add("hidden"))}
window.Game={startGame,resetGame,endGame,pauseGame,resumeGame,quitGame,getRecords,hideAllOverlays};