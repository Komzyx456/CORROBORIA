/* LumIA - script.js
   Evaluador y mejorador de prompts basado en reglas.
   No requiere API ni servicios externos.
*/
"use strict";

(() => {
  const $ = (id) => document.getElementById(id);
  const promptInput = $("promptInput");
  const charCount = $("charCount");
  const resultCard = $("resultCard");
  const menu = $("menuPopover");
  const menuToggle = $("menuToggle");

  // ---------- Utilidades ----------
  const normalize = (text) =>
    text.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function closeMenu() {
    menu?.classList.remove("open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    if (!menu || !menuToggle) return;
    const isOpen = menu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  }

  // ---------- Menú y ventanas ----------
  menuToggle?.addEventListener("click", toggleMenu);
  $("menuWord")?.addEventListener("click", toggleMenu);

  document.querySelectorAll(".menu-popover a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  function showModal(id) {
    closeMenu();
    $(id)?.classList.remove("hidden");
  }

  function hideModal(id) {
    $(id)?.classList.add("hidden");
  }

  $("openFeedback")?.addEventListener("click", () => showModal("feedbackModal"));
  $("openSettings")?.addEventListener("click", () => showModal("settingsModal"));

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => hideModal(button.dataset.close));
  });

  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop) hideModal(backdrop.id);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".modal-backdrop").forEach((modal) => {
        modal.classList.add("hidden");
      });
      closeMenu();
    }
  });

  $("feedbackForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    $("feedbackSuccess")?.classList.remove("hidden");
    event.target.reset();
  });

  // ---------- Temas visuales ----------
  const themeNames = ["beige", "wine", "black", "white", "sky"];

  function setTheme(theme) {
    if (!themeNames.includes(theme)) return;

    document.body.dataset.theme = theme;

    try {
      localStorage.setItem("lumia-theme", theme);
    } catch (_) {
      // El almacenamiento local puede estar deshabilitado.
    }

    document.querySelectorAll(".theme-option").forEach((button) => {
      button.classList.toggle("selected", button.dataset.themeChoice === theme);
    });
  }

  document.querySelectorAll(".theme-option").forEach((button) => {
    button.addEventListener("click", () => setTheme(button.dataset.themeChoice));
  });

  let savedTheme = "beige";

  try {
    savedTheme = localStorage.getItem("lumia-theme") || "beige";
  } catch (_) {}

  setTheme(savedTheme);

  // ---------- Contador ----------
  promptInput?.addEventListener("input", () => {
    if (charCount) {
      charCount.textContent = `${promptInput.value.length} / 1500`;
    }
  });

  // ---------- Detección de intención ----------
  function detectIntent(raw) {
    const t = normalize(raw);

    const research = /\b(investiga|investigar|investigacion|estudio|informe|analiza|analizar|indaga)\b/.test(t);
    const comparison = /\b(compara|comparar|diferencias|semejanzas|versus|frente a)\b/.test(t);
    const summary = /\b(resume|resumir|resumen|sintetiza|sintetizar)\b/.test(t);
    const explanation = /\b(explica|explicar|que es|como funciona|por que|describe|describir)\b/.test(t);
    const creative = /\b(cuento|poema|historia|guion|disena|dibuja|imagina|crea|escribe|redacta)\b/.test(t);
    const problem = /\b(resuelve|resolver|calcula|calcular|demuestra|soluciona)\b/.test(t);
    const translation = /\b(traduce|traducir|traduccion)\b/.test(t);

    let type = "general";

    if (research) type = "research";
    else if (comparison) type = "comparison";
    else if (summary) type = "summary";
    else if (creative) type = "creative";
    else if (problem) type = "problem";
    else if (translation) type = "translation";
    else if (explanation) type = "explanation";

    return {
      type,
      research,
      comparison,
      summary,
      explanation,
      creative,
      problem,
      translation,
      text: t
    };
  }

  // ---------- Evaluación del prompt ----------
  function evaluatePrompt(text) {
    const raw = text.trim();
    const intent = detectIntent(raw);
    const t = intent.text;
    const checks = [];
    const issues = [];

    const add = (ok, good, bad) => {
      checks.push({ ok, good, bad });
    };

    const hasTask = /\b(investiga|investigar|explica|explicar|resume|resumir|compara|comparar|analiza|analizar|crea|escribe|describe|define|evalua|disena|traduce|resuelve|propón|propone|genera|cuentame|dame|dime|enumera|calcula|responde|redacta|sintetiza)\b/i.test(raw);

    const hasSubject = raw.length >= 25 && hasTask;
    const hasContext = raw.length >= 55 || /\b(porque|para que|contexto|situacion|objetivo|en el caso de|considerando)\b/i.test(t);
    const hasAudience = /\b(para estudiantes|para alumnos|para profesores|dirigido a|audiencia|publico objetivo|ensenanza media|ensenanza basica|principiantes|expertos|ninos|adolescentes|universitarios|especialistas)\b/i.test(t);
   const hasFormat = /\b(tabla|lista|apartados|secciones|parrafos|estructura|formato|diapositivas|introduccion|conclusion|pasos|vinetas|guion|cuadro|informe|presentacion|cuento|cuentos|relato|relatos|poema|poemas|novela|historia|historias|narracion|narrativa|dialogo|dialogos|escena|escenas|600 palabras|palabras aproximadamente)\b/i.test(t);
    const hasSources = /\b(fuentes|bibliografia|referencias|citas|documentos cientificos|articulos academicos|organismos oficiales)\b/i.test(t);
    const hasExamples = /\b(ejemplo|ejemplos|caso practico|casos concretos)\b/i.test(t);
    const hasScope = /\b(entre \d{4}|durante|periodo|desde .{2,30} hasta|en chile|en latinoamerica|en .{2,30}|en los ultimos|aspectos|factores|causas|consecuencias)\b/i.test(t);

    add(
      hasSubject,
      "La tarea y el tema se pueden identificar.",
      "Define con claridad qué tarea debe realizarse y sobre qué tema."
    );

    add(
      hasContext,
      "Incluyes contexto suficiente para orientar la respuesta.",
      "Agrega contexto: explica para qué necesitas la respuesta o qué situación debe considerar."
    );

    add(
      hasAudience,
      "El público o nivel de conocimientos está indicado.",
      "Define quién utilizará la respuesta y qué nivel de conocimientos tiene."
    );

    add(
      hasFormat,
      "El formato de entrega está indicado.",
      "Indica cómo quieres recibir el resultado: informe, tabla, lista, pasos o apartados."
    );

    if (intent.research) {
      add(
        hasSources,
        "La investigación contempla fuentes o referencias.",
        "Solicita fuentes confiables y verificables, con autor u organización y fecha."
      );

      add(
        hasExamples,
        "Incluyes ejemplos para apoyar la explicación.",
        "Pide ejemplos concretos cuando ayuden a comprender el tema."
      );

      add(
        hasScope,
        "El tema tiene algunos límites o aspectos definidos.",
        "Delimita los aspectos, periodo, lugar o grupo que quieres investigar."
      );
    } else if (intent.comparison) {
      add(
        hasScope,
        "La comparación tiene criterios o límites.",
        "Indica qué criterios deben utilizarse para comparar los elementos."
      );
    } else if (intent.creative) {
      add(
        hasAudience,
        "El público está indicado o puede inferirse.",
        "Indica para quién se crea el contenido y qué tono debe tener."
      );
    }

    if (/\b(todo lo relacionado|todo sobre|absolutamente todo|todos los aspectos|toda la informacion)\b/i.test(t)) {
      issues.push("El alcance es demasiado amplio. Selecciona los aspectos más importantes, un periodo o un lugar.");
    }

    if (/\b(corta|breve)\b/i.test(t) && /\b(muy completa|muy detallada|en profundidad|exhaustiva|toda la informacion)\b/i.test(t)) {
      issues.push("Hay una posible contradicción entre brevedad y profundidad. Define una extensión o prioriza los aspectos esenciales.");
    }

    if (/\b(utiliza informacion de internet|informacion de internet)\b/i.test(t) && !hasSources) {
      issues.push("Pedir información de internet no garantiza calidad. Solicita fuentes identificables y comprobables.");
    }

    if (/\b(no importa el formato|como quieras|de cualquier forma)\b/i.test(t)) {
      issues.push("El formato queda completamente abierto. Indica cómo quieres organizar el resultado.");
    }

    if (/\b(pinguinos? articos?)\b/i.test(t)) {
      issues.push("Revisa la ubicación geográfica: los pingüinos viven naturalmente en el hemisferio sur, no en el Ártico. Quizás te refieres a pingüinos antárticos o a aves del Ártico.");
    }

    if (/\b(garantiza|asegura|100 ?% verdadero|sin errores)\b/i.test(t)) {
      issues.push("Ninguna instrucción garantiza una respuesta sin errores. Pide que se indiquen las incertidumbres y que se puedan verificar las fuentes.");
    }

    if (raw.length < 12) {
      issues.push("El prompt es demasiado corto para comprender con precisión el objetivo. Añade el tema y la tarea.");
    }

    const score = checks.filter((item) => item.ok).length;
    const total = checks.length;
    const ratio = total ? score / total : 0;

    const color =
      issues.length >= 2 || ratio < 0.35
        ? "red"
        : issues.length > 0 || ratio < 0.8
          ? "amber"
          : "green";

    return {
      checks,
      issues,
      score,
      total,
      color,
      ...intent,
      hasAudience,
      hasFormat,
      hasSources,
      hasExamples,
      hasScope
    };
  }
  // ---------- Construcción del prompt mejorado ----------
 
  // ---------- Construcción del prompt mejorado ----------
  function improvedPrompt(original) {
    const raw = original.trim();
    const analysis = evaluatePrompt(raw);
    const t = analysis.text;
    const sections = [];

    // Detectar premisas geográficas que necesitan revisión
    const hasArcticPenguins =
      /\b(pinguinos?\s+articos?|articos?\s+pinguinos?)\b/i.test(t);

    // Conservar la intención, pero no repetir una premisa incorrecta
    const correctedOriginal = hasArcticPenguins
      ? raw.replace(
          /\b(pinguinos?\s+articos?|articos?\s+pinguinos?)\b/gi,
          "pingüinos de la Antártida"
        )
      : raw;

    const taskGuidance = {
      research:
        "Realiza una investigación organizada. Explica el contexto, las causas, los factores relevantes y sus consecuencias. Distingue los hechos comprobados de las hipótesis.",

      comparison:
        "Compara los elementos utilizando criterios equivalentes. Explica semejanzas, diferencias, ventajas y desventajas. Finaliza con una conclusión fundamentada.",

      summary:
        "Resume las ideas principales sin alterar el significado. Prioriza la información esencial y no agregues datos ausentes del material original.",

      explanation:
        "Explica el tema paso a paso. Define los conceptos importantes, utiliza ejemplos pertinentes y adapta la profundidad al público objetivo.",

      creative:
        "Desarrolla una creación original que respete la idea central, el género, el tono y las condiciones solicitadas.",

      problem:
        "Resuelve la tarea paso a paso. Explica el razonamiento, muestra los procedimientos necesarios y comprueba el resultado cuando sea posible.",

      translation:
        "Traduce conservando el significado, el tono y el contexto del texto original. No añadas ni elimines información."
    };

    // 1. Objetivo
    sections.push(
      "**Objetivo y tarea:**\n" +
      (taskGuidance[analysis.type] ||
        "Responde directamente a la solicitud y mantén su propósito original.")
    );

    // 2. Advertencia y corrección geográfica
    if (hasArcticPenguins) {
      sections.push(
        "**Corrección de precisión científica:**\n" +
        "Los pingüinos viven naturalmente en el hemisferio sur, no en el Ártico. " +
        "Se ha ajustado la referencia a pingüinos de la Antártida. " +
        "No presentes esta corrección como una equivalencia entre ambas regiones."
      );
    }

    // 3. Público
    if (!analysis.hasAudience) {
      sections.push(
        "**Público objetivo:**\n" +
        "Estudiantes de enseñanza media. Utiliza lenguaje claro y explica los términos técnicos."
      );
    } else {
      sections.push(
        "**Público objetivo:**\n" +
        "Respeta el público y nivel de conocimientos indicados originalmente."
      );
    }

    // 4. Investigación
    if (analysis.type === "research") {
      sections.push(
        "**Aspectos que debes investigar:**\n" +
        "- Contexto y conceptos fundamentales.\n" +
        "- Causas y factores relacionados.\n" +
        "- Consecuencias y efectos principales.\n" +
        "- Ejemplos o casos concretos.\n" +
        "- Diferencias entre lugares, grupos o periodos cuando corresponda."
      );

      sections.push(
        "**Fuentes y verificación:**\n" +
        "Utiliza fuentes confiables y verificables. Identifica autores, instituciones y fechas. No inventes referencias y señala las limitaciones de la evidencia."
      );

      if (!analysis.hasScope) {
        sections.push(
          "**Delimitación:**\n" +
          "Define los aspectos, lugares y periodos más relevantes. Evita información ajena al objetivo."
        );
      }
    }

    // 5. Comparación
    else if (analysis.type === "comparison") {
      sections.push(
        "**Criterios de comparación:**\n" +
        "Aplica los mismos criterios a todos los elementos y presenta semejanzas, diferencias, ventajas y desventajas."
      );
    }

    // 6. Creación
    else if (analysis.type === "creative") {
      sections.push(
        "**Desarrollo creativo:**\n" +
        "Respeta el género, la idea central, los personajes y las condiciones establecidas. Mantén originalidad y coherencia."
      );
    }

    // 7. Resumen
    else if (analysis.type === "summary") {
      sections.push(
        "**Criterios del resumen:**\n" +
        "Conserva las ideas centrales, elimina repeticiones y no introduzcas información ajena al material."
      );
    }

    // 8. Problemas
    else if (analysis.type === "problem") {
      sections.push(
        "**Comprobación:**\n" +
        "Explica los pasos utilizados. Si faltan datos, indícalo en lugar de inventarlos."
      );
    }

    // 9. Traducción
    else if (analysis.type === "translation") {
      sections.push(
        "**Fidelidad de la traducción:**\n" +
        "Conserva el sentido, el registro y las expresiones del original. Utiliza el contexto para resolver ambigüedades."
      );
    }

    // 10. Formato
    if (analysis.hasFormat) {
      sections.push(
        "**Formato de respuesta:**\n" +
        "Respeta el formato y la extensión indicados originalmente."
      );
    } else if (analysis.type === "creative") {
      sections.push(
        "**Formato de respuesta:**\n" +
        "Entrega directamente la creación solicitada. No conviertas una obra creativa en un informe."
      );
    } else if (analysis.type === "research") {
      sections.push(
        "**Formato de respuesta:**\n" +
        "Organiza la investigación con título, introducción, desarrollo, conclusión y referencias."
      );
    } else {
      sections.push(
        "**Formato de respuesta:**\n" +
        "Utiliza una estructura clara, ordenada y adecuada a la tarea."
      );
    }

    // 11. Calidad
    if (analysis.type === "research" ||
        analysis.type === "explanation") {
      sections.push(
        "**Criterios de calidad:**\n" +
        "No inventes datos ni fuentes. Distingue hechos comprobados, interpretaciones e incertidumbres."
      );
    } else {
      sections.push(
        "**Criterios de calidad:**\n" +
        "Evita contradicciones, conserva el propósito original y responde con precisión."
      );
    }

    return (
      "PROMPT MEJORADO\n\n" +
      correctedOriginal +
      "\n\n" +
      sections.join("\n\n")
    );
  }
// ---------- Historial de prompts ----------

const HISTORY_KEY = "lumia-prompt-history";

let promptHistory = [];

try {
  const savedHistory = JSON.parse(
    localStorage.getItem(HISTORY_KEY) || "[]"
  );

  if (Array.isArray(savedHistory)) {
    promptHistory = savedHistory;
  }
} catch (_) {
  promptHistory = [];
}

// Mostrar los registros guardados
function renderHistory() {
  const historyList = $("historyList");

  if (!historyList) return;

  historyList.replaceChildren();

  if (promptHistory.length === 0) {
    const empty = document.createElement("p");

    empty.className = "history-empty";
    empty.textContent =
      "Todavía no tienes evaluaciones guardadas. ¡Prueba tu primer prompt con Lumi!";

    historyList.append(empty);
    return;
  }

  promptHistory.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "history-entry";

    const header = document.createElement("div");
    header.className = "history-entry-header";

    const date = document.createElement("span");
    date.textContent = entry.date;

    const score = document.createElement("strong");
    score.textContent =
      `${entry.score} de ${entry.total} criterios`;

    header.append(date, score);

    const originalTitle = document.createElement("h3");
    originalTitle.textContent = "Prompt original";

    const original = document.createElement("p");
    original.textContent = entry.prompt;

    const details = document.createElement("details");

    const summary = document.createElement("summary");
    summary.textContent = "Ver prompt mejorado";

    const improved = document.createElement("pre");
    improved.textContent = entry.improved;

    details.append(summary, improved);

    card.append(header, originalTitle, original, details);

    historyList.append(card);
  });
}

// Guardar una nueva evaluación
function saveHistoryEntry(entry) {
  // Guardar evaluación
  promptHistory.unshift(entry);
  promptHistory = promptHistory.slice(0, 20);

  try {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(promptHistory)
    );
  } catch (_) {
    console.warn("No se pudo guardar el historial.");
  }

  // Sumar una evaluación
  lumiProgress.totalEvaluations += 1;

  // Otorgar puntos por evaluar
  addLumiPoints(10, "Prompt evaluado");

  // Bono por una evaluación de 80% o más
  if (
    entry.total > 0 &&
    entry.score / entry.total >= 0.8
  ) {
    addLumiPoints(5, "Evaluación destacada");
    lumiProgress.hasHighScore = true;
  }

  // Comprobar insignias
  checkBadges();

  // Actualizar pantallas
  renderHistory();
  renderProgress();

  saveProgress();
}
   
// Botón para borrar los registros
const clearHistoryButton = document.getElementById("clearHistoryBtn");

if (clearHistoryButton) {
  clearHistoryButton.addEventListener("click", function () {
    if (promptHistory.length === 0) {
      alert("Tu historial ya está vacío.");
      return;
    }

    const confirmed = window.confirm(
      "¿Quieres borrar todo tu historial de prompts?"
    );

    if (!confirmed) return;

    promptHistory = [];

    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
      console.warn("No se pudo borrar el historial.", error);
    }

    renderHistory();
    alert("¡Historial borrado correctamente!");
  });
}
   
// Mostrar el historial al abrir LumIA
renderHistory();

// ---------- Fin del historial ----------

   // ---------- Sistema de LumiPoints ----------

const PROGRESS_KEY = "lumia-progress";

const badgeDefinitions = [
  {
    id: "first",
    icon: "🏅",
    name: "Primer análisis",
    description: "Evalúa tu primer prompt.",
    condition: (p) => p.totalEvaluations >= 1
  },
  {
    id: "explorer",
    icon: "🔎",
    name: "Explorador",
    description: "Evalúa 5 prompts.",
    condition: (p) => p.totalEvaluations >= 5
  },
  {
    id: "clear",
    icon: "💡",
    name: "Prompt claro",
    description: "Consigue una evaluación del 80% o más.",
    condition: (p) => p.hasHighScore
  },
  {
    id: "constant",
    icon: "🚀",
    name: "Constancia",
    description: "Evalúa 10 prompts.",
    condition: (p) => p.totalEvaluations >= 10
  }
];

let lumiProgress = {
  points: 0,
  totalEvaluations: 0,
  hasHighScore: false,
  unlockedBadges: [],
  ledger: []
};

try {
  const savedProgress = JSON.parse(
    localStorage.getItem(PROGRESS_KEY) || "null"
  );

  if (savedProgress && typeof savedProgress === "object") {
    lumiProgress = {
      ...lumiProgress,
      ...savedProgress
    };
  }
} catch (_) {}

function saveProgress() {
  try {
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify(lumiProgress)
    );
  } catch (_) {
    console.warn("No se pudo guardar el progreso.");
  }
}

// Añadir puntos y registrarlos
function addLumiPoints(amount, reason) {
  lumiProgress.points += amount;

  lumiProgress.ledger.unshift({
    amount,
    reason,
    date: new Date().toLocaleDateString("es-CL")
  });

  lumiProgress.ledger =
    lumiProgress.ledger.slice(0, 50);

  saveProgress();
}

// Comprobar y desbloquear insignias
function checkBadges() {
  badgeDefinitions.forEach((badge) => {
    const alreadyUnlocked =
      lumiProgress.unlockedBadges.includes(badge.id);

    if (!alreadyUnlocked && badge.condition(lumiProgress)) {
      lumiProgress.unlockedBadges.push(badge.id);

      addLumiPoints(
        25,
        "Insignia desbloqueada: " + badge.name
      );
    }
  });
}

// Mostrar insignias
function renderBadges() {
  const container = $("badgeList");

  if (!container) return;

  container.replaceChildren();

  badgeDefinitions.forEach((badge) => {
    const unlocked =
      lumiProgress.unlockedBadges.includes(badge.id);

    const card = document.createElement("article");
    card.className =
      "badge-card" + (unlocked ? " unlocked" : " locked");

    const icon = document.createElement("div");
    icon.className = "badge-icon";
    icon.textContent = unlocked ? badge.icon : "🔒";

    const name = document.createElement("h4");
    name.textContent = badge.name;

    const description = document.createElement("p");
    description.textContent = badge.description;

    const status = document.createElement("span");
    status.textContent =
      unlocked ? "Desbloqueada ✓" : "Bloqueada";

    card.append(icon, name, description, status);
    container.append(card);
  });
}

// Mostrar LumiPoints y nivel
function renderPoints() {
  const points = lumiProgress.points;
  const level = Math.floor(points / 100) + 1;
  const progress = points % 100;

  if ($("lumiPoints")) {
    $("lumiPoints").textContent = points;
  }

  if ($("lumiLevel")) {
    $("lumiLevel").textContent =
      `Nivel ${level} · ${
        level === 1 ? "Principiante" :
        level === 2 ? "Aprendiz" :
        level === 3 ? "Experto" : "Maestro"
      }`;
  }

  if ($("levelProgressText")) {
    $("levelProgressText").textContent =
      `${progress} / 100 LP`;
  }

  if ($("levelProgressBar")) {
    $("levelProgressBar").style.width =
      `${progress}%`;
  }
}

// Mostrar el registro de puntos
function renderPointsHistory() {
  const container = $("pointsHistory");

  if (!container) return;

  container.replaceChildren();

  if (lumiProgress.ledger.length === 0) {
    const empty = document.createElement("p");
    empty.textContent =
      "Todavía no has conseguido LumiPoints.";
    empty.className = "history-empty";

    container.append(empty);
    return;
  }

  lumiProgress.ledger.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "points-entry";

    const info = document.createElement("div");

    const reason = document.createElement("strong");
    reason.textContent = entry.reason;

    const date = document.createElement("small");
    date.textContent = entry.date;

    info.append(reason, date);

    const amount = document.createElement("strong");
    amount.className = "points-amount";
    amount.textContent = `+${entry.amount} LP`;

    row.append(info, amount);
    container.append(row);
  });
}

// Actualizar toda la pantalla
function renderProgress() {
  renderPoints();
  renderBadges();
  renderPointsHistory();
}

// Mostrar progreso guardado
renderProgress();

// ---------- Fin del sistema de LumiPoints ----------
   
  // ---------- Evaluación y presentación ----------
  $("evaluateBtn")?.addEventListener("click", () => {
    if (!promptInput) return;

    const value = promptInput.value.trim();

    if (!value) {
      promptInput.focus();
      promptInput.setCustomValidity("Escribe un prompt antes de revisarlo.");
      promptInput.reportValidity();

      promptInput.addEventListener(
        "input",
        () => promptInput.setCustomValidity(""),
        { once: true }
      );

      return;
    }

    const result = evaluatePrompt(value);

    const labels = {
      red: "¡Alto! Hay que replantearlo",
      amber: "¡Luz ámbar! Puede mejorar",
      green: "¡Luz verde! Buen trabajo"
    };

    const summaries = {
      red: "Tu instrucción necesita más precisión para orientar bien la respuesta.",
      amber: "Tienes una base útil, pero puedes agregar detalles para obtener un resultado más claro.",
      green: "Tu prompt incluye varios elementos importantes. Revisa igualmente la propuesta mejorada."
    };

    if ($("resultTitle")) {
      $("resultTitle").textContent = labels[result.color];
    }

    if ($("resultSummary")) {
      $("resultSummary").textContent =
        `${summaries[result.color]} ${result.score} de ${result.total} criterios detectados.`;
    }

    const bulb = $("resultBulb")?.querySelector("span");

    if (bulb) {
      bulb.style.background =
        result.color === "red"
          ? "#e95b55"
          : result.color === "amber"
            ? "#f4b52e"
            : "#68b84b";
    }

    const messages = result.checks
      .filter((item) => !item.ok)
      .map((item) => ({
        icon: "✦",
        text: item.bad
      }))
      .concat(
        result.issues.map((text) => ({
          icon: "⚠",
          text
        }))
      );

    if (!messages.length) {
      messages.push({
        icon: "✓",
        text: "No detectamos problemas importantes en los criterios básicos de este prototipo."
      });
    }

    const feedbackList = $("feedbackList");

    if (feedbackList) {
      feedbackList.replaceChildren();

      messages.forEach((message) => {
        const item = document.createElement("div");
        item.className = "feedback-item";

        const icon = document.createElement("b");
        icon.className = "feedback-icon";
        icon.textContent = message.icon;

        const content = document.createElement("span");
        content.textContent = message.text;

        item.append(icon, content);
        feedbackList.append(item);
      });
    }

    const improved = $("improvedPrompt");

    if (improved) {
      improved.textContent = improvedPrompt(value);
    }
     
// Guardar la evaluación en el historial
saveHistoryEntry({
  prompt: value,
  improved: improved ? improved.textContent : "",
  score: result.score,
  total: result.total,
  date: new Date().toLocaleString("es-CL")
});
     
    resultCard?.classList.remove("hidden");
    resultCard?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  });

  // ---------- Copiar prompt ----------
  $("copyBtn")?.addEventListener("click", async () => {
    const button = $("copyBtn");
    const text = $("improvedPrompt")?.textContent || "";

    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      if (button) {
        button.textContent = "¡Copiado! ✓";
      }
    } catch (_) {
      if (button) {
        button.textContent = "Selecciona y copia";
      }
    }

    window.setTimeout(() => {
      if (button) {
        button.textContent = "Copiar ↗";
      }
    }, 1800);
  });
     // ---------- Consejos del semáforo ----------
  const tips = {
    red: {
      tag: "🔴 LUZ ROJA · DETENTE",
      title: "Evita estos errores",
      desc: "Antes de enviar tu prompt, comprueba que las instrucciones sean claras.",
      items: [
        "No pidas «todo sobre un tema» sin delimitarlo.",
        "No compartas contraseñas, datos personales ni información privada.",
        "No aceptes una respuesta como verdadera sin comprobar los datos importantes."
      ]
    },

    amber: {
      tag: "🟡 LUZ ÁMBAR · REVISA",
      title: "¡Puedes hacerlo más claro!",
      desc: "Tu idea puede mejorar si agregas detalles que orienten la respuesta.",
      items: [
        "Explica el contexto y el objetivo de tu petición.",
        "Define el público, el tono y la extensión que necesitas.",
        "Si la respuesta no te sirve, reformula la instrucción y pregunta de nuevo."
      ]
    },

    green: {
      tag: "🟢 LUZ VERDE · AVANZA",
      title: "Buenas prácticas para usar IA",
      desc: "Una buena instrucción ayuda a obtener respuestas más útiles, pero siempre debes usar tu criterio.",
      items: [
        "Indica una tarea concreta y entrega contexto relevante.",
        "Pide ejemplos, estructura y fuentes cuando corresponda.",
        "Comprueba la información y utiliza la IA como apoyo para aprender."
      ]
    }
  };

  document.querySelectorAll(".traffic-light").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".traffic-light").forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");

      const tip = tips[button.dataset.color];

      if (!tip) return;

      if ($("tipTag")) {
        $("tipTag").textContent = tip.tag;
      }

      if ($("tipTitle")) {
        $("tipTitle").textContent = tip.title;
      }

      if ($("tipDescription")) {
        $("tipDescription").textContent = tip.desc;
      }

      const tipList = $("tipList");

      if (tipList) {
        tipList.replaceChildren();

        tip.items.forEach((text) => {
          const item = document.createElement("li");
          item.textContent = text;
          tipList.append(item);
        });
      }
    });
  });

  // ---------- Instalación PWA ----------
  let deferredInstallPrompt = null;

  const installModal = $("installModal");
  const installAction = $("installAction");
  const installMessage = $("installMessage");

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();

    deferredInstallPrompt = event;

    installAction?.classList.remove("hidden");

    if (installMessage) {
      installMessage.textContent =
        "¡LumIA se puede instalar en este dispositivo! Pulsa el botón para continuar.";
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;

    if (installMessage) {
      installMessage.textContent =
        "¡LumIA quedó instalada! Ya puedes abrirla desde tu dispositivo.";
    }

    installAction?.classList.add("hidden");
  });

  $("installApp")?.addEventListener("click", () => {
    closeMenu();

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (standalone) {
      if (installMessage) {
        installMessage.textContent =
          "LumIA ya está abierta en modo aplicación en este dispositivo.";
      }

      installAction?.classList.add("hidden");
    } else if (!deferredInstallPrompt) {
      if (installMessage) {
        installMessage.textContent =
          "La instalación automática no está disponible en este navegador todavía. Puedes usar las instrucciones según tu dispositivo.";
      }

      installAction?.classList.add("hidden");
    }

    installModal?.classList.remove("hidden");
  });

  installAction?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;

    deferredInstallPrompt.prompt();

    await deferredInstallPrompt.userChoice;

    deferredInstallPrompt = null;

    installAction.classList.add("hidden");
  });

  // ---------- Service worker ----------
  if (
    "serviceWorker" in navigator &&
    (location.protocol === "https:" || location.hostname === "localhost")
  ) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./service-worker.js")
        .catch((error) => {
          console.warn(
            "No se pudo registrar el modo sin conexión:",
            error
          );
        });
    });
  }
})();
