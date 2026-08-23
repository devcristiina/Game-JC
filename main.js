const $=id=>document.getElementById(id);
$("playBtn").onclick=()=>Game.startGame();
$("restartBtn").onclick=()=>{Game.hideAllOverlays();Game.resetGame()};
$("menuBtn").onclick=()=>{Game.quitGame()};
$("pauseBtn").onclick=()=>Game.pauseGame();
$("resumeBtn").onclick=()=>Game.resumeGame();
$("quitBtn").onclick=()=>Game.quitGame();

$("howBtn").onclick=()=>{
  $("infoTitle").textContent="COMO JOGAR";
  $("infoContent").innerHTML="<ul><li>Corra sempre para a direita e use o salto para desviar.</li><li>Quando colidir com um obstáculo, uma pergunta aparecerá.</li><li>Acertar dá pontos e aumenta o combo.</li><li>Errar perde uma vida e reinicia o combo.</li><li>Se a câmera alcançar você ou suas vidas acabarem, é Game Over.</li><li>Quanto mais longe você chegar, mais rápida e difícil fica a partida.</li></ul>";
  $("infoModal").classList.remove("hidden");
};
$("recordsBtn").onclick=()=>{
  const r=Game.getRecords();
  $("infoTitle").textContent="🏆 RECORDES";
  $("infoContent").innerHTML=`<ul>
  <li>Maior pontuação: <b>${(r.score||0).toLocaleString("pt-BR")}</b></li>
  <li>Maior distância: <b>${r.distance||0} m</b></li>
  <li>Maior tempo: <b>${formatTime(r.time||0)}</b></li>
  <li>Maior combo: <b>x${r.combo||0}</b></li>
  <li>Mais acertos em uma partida: <b>${r.correct||0}</b></li></ul>`;
  $("infoModal").classList.remove("hidden");
};
$("subjectsBtn").onclick=()=>{
  $("infoTitle").textContent="📚 MATÉRIAS";
  $("infoContent").innerHTML="<p>Matemática, Física, Química, Biologia, História, Geografia, Português, Filosofia e Sociologia.</p><p>A dificuldade aumenta conforme a distância percorrida.</p>";
  $("infoModal").classList.remove("hidden");
};
document.querySelector("[data-close]").onclick=()=>$("infoModal").classList.add("hidden");

const keyMap={ArrowLeft:"left",a:"left",A:"left",ArrowRight:"right",d:"right",D:"right"};
window.addEventListener("keydown",e=>{
  if(keyMap[e.key]){input[keyMap[e.key]]=true;e.preventDefault()}
  if(["ArrowUp","w","W"," "].includes(e.key)){input.jump=true;e.preventDefault()}
  if(e.key==="Escape"&&game?.state==="PLAYING")Game.pauseGame();
});
window.addEventListener("keyup",e=>{if(keyMap[e.key])input[keyMap[e.key]]=false});

function holdButton(el,prop){
  el.addEventListener("pointerdown",e=>{e.preventDefault();input[prop]=true});
  ["pointerup","pointercancel","pointerleave"].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();input[prop]=false}));
}
holdButton($("leftBtn"),"left");holdButton($("rightBtn"),"right");
$("jumpBtn").addEventListener("pointerdown",e=>{e.preventDefault();input.jump=true});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&game?.state==="PLAYING")Game.pauseGame()});