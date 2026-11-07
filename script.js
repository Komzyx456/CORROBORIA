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
function setTheme(theme){if(!themeNames.includes(theme))return;document.body.dataset.theme=theme;try{localStorage.setItem("lumia-theme",theme)}catch{}document.querySelectorAll(".theme-option").forEach(b=>b.classList.toggle("selected",b.dataset.themeChoice===theme))}
document.querySelectorAll(".theme-option").forEach(b=>b.addEventListener("click",()=>setTheme(b.dataset.themeChoice)));
let savedTheme="beige";try{savedTheme=localStorage.getItem("lumia-theme")||"beige"}catch{}setTheme(savedTheme);

promptInput.addEventListener("input",()=>charCount.textContent=`${promptInput.value.length} / 1500`);
function evaluatePrompt(text){
 const raw=text.trim(),t=raw.toLocaleLowerCase('es');
 const isResearch=/\b(investiga|investigación|investigar|estudio|informe|analiza|analizar)\b/i.test(t);
 const isCreative=/\b(cuento|poema|historia|guion|diseña|dibuja|imagina|crea)\b/i.test(t);
 const checks=[],issues=[];
 const add=(ok,good,bad)=>checks.push({ok,good,bad});
 add(raw.length>=35,"El contexto permite entender la solicitud.","Agrega contexto: explica qué necesitas y por qué.");
 add(/\b(investiga|investigar|explica|resume|compara|analiza|analizar|crea|escribe|describe|define|evalúa|diseña|traduce|resuelve|propón|genera|cuéntame|cuentame|dame|dime|enumera|calcula|responde)\b/i.test(t),"La acción que debe realizar la IA está identificada.","Indica una acción concreta: investigar, explicar, comparar, crear, resumir, etc.");
 const hasAudience=/\b(para estudiantes|para alumnos|para profesores|dirigido a|audiencia|público objetivo|enseñanza media|enseñanza básica|principiantes|expertos|niños|adolescentes|universitarios)\b/i.test(t);
 add(hasAudience,"El público o nivel está indicado.","Define quién utilizará la respuesta y qué nivel de conocimientos tiene.");
 const hasFormat=/\b(tabla|lista|apartados|secciones|párrafos|estructura|formato|diapositivas|introducción|conclusión|pasos|viñetas|guion)\b/i.test(t);
 add(hasFormat,"La forma de presentar el resultado está orientada.","Indica el formato que te sirve: pasos, lista, tabla, apartados o párrafos.");
 if(isResearch){
  add(/\b(fuentes|bibliografía|referencias|citas|documentos científicos|artículos académicos)\b/i.test(t),"La investigación contempla fuentes o referencias.","Pide fuentes confiables y verificables, con autor/organización y fecha.");
  add(/\b(ejemplo|ejemplos|caso práctico|casos concretos)\b/i.test(t),"Incluyes ejemplos como apoyo.","Pide uno o dos ejemplos concretos si ayudan a entender el tema.");
 }
 if(/\b(corta|breve)\b/i.test(t)&&/\b(muy completa|muy detallada|en profundidad|exhaustiva|toda la información)\b/i.test(t)) issues.push("Posible contradicción de extensión: pides profundidad y brevedad al mismo tiempo. Define una extensión o prioriza los aspectos esenciales.");
 if(/\b(todo lo relacionado|todo sobre|absolutamente todo|todos los aspectos|toda la información)\b/i.test(t)) issues.push("El alcance es demasiado amplio. Delimita los aspectos, periodo, lugar o grupo que te interesa.");
 if(/\b(utiliza información de internet|información de internet)\b/i.test(t)&&! /\b(fuentes confiables|fuentes verificables|referencias|bibliografía|citas)\b/i.test(t)) issues.push("Pedir información de internet no garantiza calidad. Solicita fuentes identificables y comprobables.");
 if(/\b(no importa el formato|como quieras|de cualquier forma)\b/i.test(t)) issues.push("El formato queda completamente abierto. Indica cómo quieres organizar el resultado.");
 if(/\b(pingüinos? árticos?|pinguinos? articos?)\b/i.test(t)) issues.push("Revisa la premisa geográfica: no existen poblaciones naturales de pingüinos en el Ártico; viven de forma natural en el hemisferio sur. ¿Te refieres a pingüinos antárticos o al efecto del cambio climático sobre aves del Ártico?");
 if(/\b(garantiza|asegura|100 ?% verdadero|sin errores)\b/i.test(t)) issues.push("Ninguna instrucción puede garantizar que la IA no se equivoque. Pide que reconozca incertidumbres y permita verificar las fuentes.");
 const score=checks.filter(x=>x.ok).length,total=checks.length,ratio=total?score/total:0;
 const color=(issues.length>=2||score<=1||ratio<.3)?"red":(issues.length>0||ratio<.8)?"amber":"green";
 return {checks,issues,score,total,color,isResearch,isCreative};
}


function improvedPrompt(original) {
  const raw = original.trim();
  const analysis = evaluatePrompt(raw);
  const research = analysis.isResearch;
  const creative = analysis.isCreative;

  const audience = /\b(para estudiantes|para alumnos|para profesores|dirigido a|audiencia|público objetivo|enseñanza media|enseñanza básica|principiantes|expertos|niños|adolescentes|universitarios)\b/i.test(raw)
    ? "Respeta el público objetivo indicado en la solicitud original."
    : "Público objetivo: estudiantes de enseñanza media. Utiliza lenguaje claro y explica los conceptos técnicos.";

  const format = /\b(tabla|lista|apartados|secciones|párrafos|estructura|formato|diapositivas|introducción|conclusión|pasos|viñetas|guion)\b/i.test(raw)
    ? "Respeta el formato solicitado originalmente."
    : research
      ? "Organiza la respuesta con introducción, desarrollo por apartados y conclusión."
      : "Organiza la respuesta en una estructura clara y fácil de seguir.";

  let sections = "";

  if (research) {
    sections = `
**Desarrollo de la investigación:**
- Explica los conceptos fundamentales relacionados con el tema.
- Identifica los principales factores, causas y consecuencias pertinentes.
- Incluye ejemplos concretos y relevantes.
- Distingue los hechos comprobados de las hipótesis y proyecciones.
`;
  } else if (creative) {
    sections = `
**Orientaciones para la creación:**
- Desarrolla la idea original sin cambiar su intención.
- Mantén coherencia y creatividad.
- Adapta el resultado al contexto de la solicitud.
`;
  } else {
    sections = `
**Orientaciones para responder:**
- Resuelve directamente la tarea solicitada.
- Explica los pasos o argumentos necesarios.
- Incluye ejemplos cuando sean útiles.
`;
  }

  const sources = research
    ? `
**Fuentes y verificación:**
Utiliza fuentes confiables y verificables. Identifica autores, instituciones y fechas. No inventes referencias y señala las limitaciones de la información disponible.
`
    : "";

  return `# PROMPT MEJORADO

**Solicitud principal:**
${raw}

**Objetivo:**
Cumple la solicitud original de manera clara, precisa y completa.

**Público y nivel:**
${audience}

${sections}
**Formato de respuesta:**
${format}

${sources}
**Instrucción final:**
Conserva el tema, el enfoque y la intención de la solicitud original. No incorpores temas ajenos ni inventes información. Si falta un dato indispensable, indica qué información necesitas antes de asumirla.
`;
}
  const raw = original.trim();
  const analysis = evaluatePrompt(raw);
  const research = analysis.isResearch;
  const creative = analysis.isCreative;

  const audience = /\b(para estudiantes|para alumnos|para profesores|dirigido a|audiencia|público objetivo|enseñanza media|enseñanza básica|principiantes|expertos|niños|adolescentes|universitarios)\b/i.test(raw)
    ? "Respeta el público objetivo indicado en la solicitud original."
    : "Público objetivo: estudiantes de enseñanza media. Utiliza lenguaje claro y explica los conceptos técnicos.";

  const format = /\b(tabla|lista|apartados|secciones|párrafos|estructura|formato|diapositivas|introducción|conclusión|pasos|viñetas|guion)\b/i.test(raw)
    ? "Respeta el formato solicitado originalmente."
    : research
      ? "Organiza la respuesta con introducción, desarrollo por apartados y conclusión."
      : "Organiza la respuesta en una estructura clara y fácil de seguir.";

  let sections = "";

  if (research) {
    sections = `
**Desarrollo de la investigación:**
- Explica los conceptos fundamentales relacionados con el tema.
- Identifica los principales factores, causas y consecuencias pertinentes.
- Incluye ejemplos concretos y relevantes.
- Distingue los hechos comprobados de las hipótesis y proyecciones.
`;
  } else if (creative) {
    sections = `
**Orientaciones para la creación:**
- Desarrolla la idea original sin cambiar su intención.
- Mantén coherencia y creatividad.
- Adapta el resultado al contexto de la solicitud.
`;
  } else {
    sections = `
**Orientaciones para responder:**
- Resuelve directamente la tarea solicitada.
- Explica los pasos o argumentos necesarios.
- Incluye ejemplos cuando sean útiles.
`;
  }

  const sources = research
    ? `
**Fuentes y verificación:**
Utiliza fuentes confiables y verificables. Identifica autores, instituciones y fechas. No inventes referencias y señala las limitaciones de la información disponible.
`
    : "";

  return `# PROMPT MEJORADO

**Solicitud principal:**
${raw}

**Objetivo:**
Cumple la solicitud original de manera clara, precisa y completa.

**Público y nivel:**
${audience}

${sections}
**Formato de respuesta:**
${format}

${sources}
**Instrucción final:**
Conserva el tema, el enfoque y la intención de la solicitud original. No incorpores temas ajenos ni inventes información. Si falta un dato indispensable, indica qué información necesitas antes de asumirla.
`;
}

 const raw=original.trim(),t=raw.toLocaleLowerCase('es');
 const analysis=evaluatePrompt(raw), additions=[];
 const research=analysis.isResearch;
 // Mantener intactos el tema y la intención: nunca añadir un dominio temático fijo.
 if(!/\b(para estudiantes|para alumnos|para profesores|dirigido a|audiencia|público objetivo|enseñanza media|enseñanza básica|principiantes|expertos|niños|adolescentes|universitarios)\b/i.test(t)) additions.push("Adapta el nivel de detalle y el vocabulario a un público general, explicando los términos técnicos necesarios.");
 if(!/\b(tabla|lista|apartados|secciones|párrafos|estructura|formato|diapositivas|introducción|conclusión|pasos|viñetas|guion)\b/i.test(t)) additions.push(research?"Organiza el contenido con introducción, desarrollo en apartados y conclusión.":"Presenta el resultado en una estructura clara y fácil de seguir, adecuada para la tarea solicitada.");
 if(research&&!/\b(fuentes|bibliografía|referencias|citas|documentos científicos|artículos académicos)\b/i.test(t)) additions.push("Utiliza fuentes confiables y verificables; identifica autor u organización y fecha. No inventes citas ni referencias.");
 if(research&&!/\b(ejemplo|ejemplos|caso práctico|casos concretos)\b/i.test(t)) additions.push("Incluye ejemplos concretos cuando aporten claridad al tema.");
 if(/\b(todo lo relacionado|todo sobre|absolutamente todo|todos los aspectos|toda la información)\b/i.test(t)) additions.push("Delimita el desarrollo a los aspectos más relevantes del tema, evitando desviarte hacia asuntos secundarios.");
 if(/\b(corta|breve)\b/i.test(t)&&/\b(muy completa|muy detallada|en profundidad|exhaustiva|toda la información)\b/i.test(t)) additions.push("Resuelve la tensión entre profundidad y brevedad: prioriza los puntos esenciales y utiliza una extensión equilibrada.");
 additions.push("Mantén exactamente el tema, el enfoque y el objetivo de mi solicitud original. No sustituyas el tema ni agregues áreas que no haya pedido.");
 additions.push("Distingue los hechos comprobados de las interpretaciones o proyecciones. Si la pregunta contiene una premisa dudosa o incorrecta, señálala y pide aclaración en vez de asumirla como verdadera.");
 const unique=[...new Set(additions)];
 return `${raw}\n\nIndicaciones para desarrollar la solicitud:\n${unique.map((x,i)=>`${i+1}. ${x}`).join("\n")}`;
}

document.getElementById("evaluateBtn").addEventListener("click",()=>{
 const value=promptInput.value.trim();if(!value){promptInput.focus();promptInput.setCustomValidity("Escribe un prompt antes de revisarlo.");promptInput.reportValidity();promptInput.addEventListener("input",()=>promptInput.setCustomValidity(""),{once:true});return}
 const r=evaluatePrompt(value),labels={red:"¡Alto! Hay que replantearlo",amber:"¡Luz ámbar! Puede mejorar",green:"¡Luz verde! Buen trabajo"},summaries={red:"Tu instrucción todavía necesita cambios importantes para orientar bien a la IA.",amber:"Tienes una base útil, pero encontramos aspectos que podrían confundir o limitar la respuesta.",green:"Tu prompt es claro y coherente. Revísalo una vez más y comprueba la respuesta que recibas."};
 document.getElementById("resultTitle").textContent=labels[r.color];document.getElementById("resultSummary").textContent=`${summaries[r.color]} ${r.score} de ${r.total} criterios detectados.`;
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
