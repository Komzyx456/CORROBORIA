const promptInput=document.getElementById("promptInput"),charCount=document.getElementById("charCount"),resultCard=document.getElementById("resultCard");
const menu=document.getElementById("menuPopover"),menuToggle=document.getElementById("menuToggle");
function closeMenu(){menu.classList.remove("open");menuToggle.setAttribute("aria-expanded","false")}
function toggleMenu(){const open=menu.classList.toggle("open");menuToggle.setAttribute("aria-expanded",String(open))}
menuToggle.addEventListener("click",toggleMenu);document.getElementById("menuWord").addEventListener("click",toggleMenu);
document.querySelectorAll(".menu-popover a").forEach(a=>a.addEventListener("click",closeMenu));
function showModal(id){closeMenu();document.getElementById(id).classList.remove("hidden")}
function hideModal(id){document.getElementById(id).classList.add("hidden")}
document.getElementById("openFeedback").addEventListener("click",()=>showModal("feedbackModal"));
document.getElementById("openSettings").addEventListener("click",()=>showModal("settingsModal"));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>hideModal(b.dataset.close)));
document.querySelectorAll(".modal-backdrop").forEach(bg=>bg.addEventListener("click",e=>{if(e.target===bg)hideModal(bg.id)}));
document.addEventListener("keydown",e=>{if(e.key==="Escape")document.querySelectorAll(".modal-backdrop").forEach(m=>m.classList.add("hidden"))});
document.getElementById("feedbackForm").addEventListener("submit",e=>{e.preventDefault();document.getElementById("feedbackSuccess").classList.remove("hidden");e.target.reset()});

const themeNames=["beige","wine","black","white","sky"];
function setTheme(theme){if(!themeNames.includes(theme))return;document.body.dataset.theme=theme;document.querySelectorAll(".theme-option").forEach(b=>b.classList.toggle("selected",b.dataset.themeChoice===theme))}
document.querySelectorAll(".theme-option").forEach(b=>b.addEventListener("click",()=>setTheme(b.dataset.themeChoice)));
setTheme("beige");

promptInput.addEventListener("input",()=>charCount.textContent=`${promptInput.value.length} / 1500`);
function evaluatePrompt(text){
 const t=text.toLowerCase(),checks=[];
 const add=(ok,good,bad)=>checks.push({ok,good,bad});
 add(text.trim().length>=35,"Incluyes contexto para entender el tema.","Agrega contexto: explica qué necesitas investigar y para qué.");
 add(/\b(investiga|explica|resume|compara|analiza|crea|describe|define|evalua|evalúa)\b/.test(t),"La tarea principal se entiende.","Indica una acción concreta: investigar, comparar, explicar o analizar.");
 add(/\b(para estudiantes|para alumnos|para profesores|dirigido a|audiencia|nivel escolar|enseñanza media|principiantes)\b/.test(t),"Defines a quién va dirigida la respuesta.","Especifica el público: por ejemplo, estudiantes de enseñanza media.");
 add(/\b(tabla|lista|apartados|secciones|párrafos|estructura|formato|diapositivas|introducción)\b/.test(t),"Das indicaciones sobre la estructura.","Define el formato: introducción, apartados, conclusión, tabla o lista.");
 add(/\b(fuentes confiables|fuentes verificables|fuentes académicas|bibliografía|citas|referencias)\b/.test(t),"Pides fuentes o referencias verificables.","Solicita fuentes confiables, citas y referencias que se puedan comprobar.");
 add(/\b(ejemplo|ejemplos|caso práctico|casos)\b/.test(t),"Pides ejemplos para aclarar la información.","Pide uno o dos ejemplos concretos para comprender mejor el tema.");
 const issues=[];
 if(/muy completa|muy detallada|toda la información/.test(t)&&/pero (también )?(corta|breve)|corta y fácil|breve y completa/.test(t))issues.push("Contradicción: pides una investigación muy completa, pero también corta. Define una extensión aproximada o prioriza los puntos más importantes.");
 if(/todo lo relacionado|todo sobre|todo lo que|toda la información necesaria|impacto.*mundo actual/.test(t))issues.push("Tema demasiado amplio: delimita el enfoque, por ejemplo IA en educación, empleo o vida cotidiana.");
 if(/buena o mala|bueno o malo/.test(t))issues.push("Pregunta demasiado absoluta: analiza beneficios, riesgos y condiciones de uso en lugar de decidir si la IA es buena o mala.");
 if(/utiliza información de internet|información de internet/.test(t)&&!/fuentes confiables|fuentes verificables|fuentes académicas|bibliografía|citas|referencias/.test(t))issues.push("Fuentes poco definidas: pedir información de internet no garantiza que sea confiable ni actualizada.");
 if(/no importa el formato/.test(t)&&/investigación|informe|trabajo/.test(t))issues.push("Falta de estructura: para una investigación conviene indicar apartados y formato.");
 if(/asegúrate de que todo sea verdadero|todo sea verdadero/.test(t))issues.push("La instrucción pide veracidad, pero no indica cómo comprobarla. Solicita fuentes, fechas y advertencias cuando existan dudas.");
 const score=checks.filter(c=>c.ok).length;
 const color=(issues.length>=3||score<=1)?"red":(issues.length>=1||score<=4)?"amber":"green";
 return{checks,issues,score,color};
}
function improvedPrompt(original){return `${original.trim()}\n\nPara mejorar la investigación, delimita el tema a los principales efectos de la inteligencia artificial en la educación, el empleo y la vida cotidiana. Organiza la respuesta con introducción, secciones temáticas y conclusión. Utiliza un lenguaje claro para estudiantes de enseñanza media y una extensión aproximada de 700 a 900 palabras. Incluye ejemplos concretos y utiliza fuentes confiables y recientes, indicando sus nombres y fechas. Distingue los hechos comprobados de las proyecciones y presenta beneficios y riesgos sin reducir el tema a una respuesta simplemente buena o mala.`}
document.getElementById("evaluateBtn").addEventListener("click",()=>{
 const value=promptInput.value.trim();if(!value){promptInput.focus();promptInput.setCustomValidity("Escribe un prompt antes de revisarlo.");promptInput.reportValidity();promptInput.addEventListener("input",()=>promptInput.setCustomValidity(""),{once:true});return}
 const r=evaluatePrompt(value),labels={red:"¡Alto! Hay que replantearlo",amber:"¡Luz ámbar! Puede mejorar",green:"¡Luz verde! Buen trabajo"},summaries={red:"Tu instrucción todavía necesita cambios importantes para orientar bien a la IA.",amber:"Tienes una base útil, pero encontramos aspectos que podrían confundir o limitar la respuesta.",green:"Tu prompt es claro y coherente. Revísalo una vez más y comprueba la respuesta que recibas."};
 document.getElementById("resultTitle").textContent=labels[r.color];document.getElementById("resultSummary").textContent=`${summaries[r.color]} ${r.score} de 6 criterios detectados.`;
 document.querySelector("#resultBulb span").style.background=r.color==="red"?"#e95b55":r.color==="amber"?"#f4b52e":"#68b84b";
 const messages=r.checks.filter(c=>!c.ok).map(c=>({icon:"✦",text:c.bad})).concat(r.issues.map(text=>({icon:"⚠",text})));
 if(!messages.length)messages.push({icon:"✓",text:"No detectamos problemas importantes con los criterios básicos de este prototipo."});
 document.getElementById("feedbackList").innerHTML=messages.map(m=>`<div class="feedback-item"><b class="feedback-icon">${m.icon}</b><span>${m.text}</span></div>`).join("");
 document.getElementById("improvedPrompt").textContent=improvedPrompt(value);resultCard.classList.remove("hidden");resultCard.scrollIntoView({behavior:"smooth",block:"nearest"});
});
document.getElementById("copyBtn").addEventListener("click",async()=>{const b=document.getElementById("copyBtn");try{await navigator.clipboard.writeText(document.getElementById("improvedPrompt").textContent);b.textContent="¡Copiado! ✓"}catch{b.textContent="Selecciona y copia"}setTimeout(()=>b.textContent="Copiar ↗",1800)});
const tips={
 red:{tag:"🔴 LUZ ROJA · DETENTE",title:"Evita estos errores",desc:"Antes de enviar tu prompt, detente y comprueba que no tenga instrucciones confusas.",items:["No pidas «todo sobre un tema» sin delimitarlo.","No compartas contraseñas, datos personales ni información privada.","No aceptes una respuesta como verdadera sin comprobar los datos importantes."]},
 amber:{tag:"🟡 LUZ ÁMBAR · REVISA",title:"¡Puedes hacerlo más claro!",desc:"Tu idea puede mejorar si agregas detalles que orienten la respuesta.",items:["Explica el contexto y el objetivo de tu petición.","Define el público, el tono y la extensión que necesitas.","Si la respuesta no te sirve, reformula la instrucción y pregunta de nuevo."]},
 green:{tag:"🟢 LUZ VERDE · AVANZA",title:"Buenas prácticas para usar IA",desc:"Una buena instrucción ayuda a obtener respuestas más útiles, pero siempre debes usar tu criterio.",items:["Indica una tarea concreta y entrega contexto relevante.","Pide ejemplos, estructura y fuentes cuando corresponda.","Comprueba la información y utiliza la IA como apoyo para aprender."]}
};
document.querySelectorAll(".traffic-light").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".traffic-light").forEach(x=>x.classList.remove("active"));btn.classList.add("active");const tip=tips[btn.dataset.color];document.getElementById("tipTag").textContent=tip.tag;document.getElementById("tipTitle").textContent=tip.title;document.getElementById("tipDescription").textContent=tip.desc;document.getElementById("tipList").innerHTML=tip.items.map(x=>`<li>${x}</li>`).join("")}));

// Instalación como PWA (requiere HTTPS o localhost).
let deferredInstallPrompt = null;
const installModal = document.getElementById("installModal");
const installAction = document.getElementById("installAction");
const installMessage = document.getElementById("installMessage");
const installHelp = document.getElementById("installHelp");
window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installAction.classList.remove("hidden");
  installMessage.textContent = "¡LumIA se puede instalar en este dispositivo! Pulsa el botón para continuar.";
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  installMessage.textContent = "¡LumIA quedó instalada! Ya puedes abrirla desde tu dispositivo.";
  installAction.classList.add("hidden");
});
document.getElementById("installApp").addEventListener("click", () => {
  closeMenu();
  const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  if (standalone) {
    installMessage.textContent = "LumIA ya está abierta en modo aplicación en este dispositivo.";
    installAction.classList.add("hidden");
  } else if (!deferredInstallPrompt) {
    installMessage.textContent = "La instalación automática no está disponible en este navegador todavía. Puedes usar las instrucciones según tu dispositivo.";
    installAction.classList.add("hidden");
  }
  installModal.classList.remove("hidden");
});
installAction.addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installAction.classList.add("hidden");
});
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(error => console.warn("No se pudo registrar el modo sin conexión:", error)));
}
