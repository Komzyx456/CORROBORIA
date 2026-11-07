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
    const hasFormat = /\b(tabla|lista|apartados|secciones|parrafos|estructura|formato|diapositivas|introduccion|conclusion|pasos|vinetas|guion|cuadro|informe|presentacion)\b/i.test(t);
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
