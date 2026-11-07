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
  // ---------- Construcción del prompt mejorado ----------
  function improvedPrompt(original) {
    const raw = original.trim();
    const analysis = evaluatePrompt(raw);
    const t = analysis.text;
    const sections = [];

    let taskGuidance = "";

    switch (analysis.type) {
      case "research":
        taskGuidance = "Realiza una investigación ordenada y centrada en el tema solicitado. Explica los factores relevantes, sus causas y consecuencias, y diferencia la evidencia disponible de las hipótesis.";
        break;

      case "comparison":
        taskGuidance = "Compara los elementos solicitados utilizando criterios claros. Expón semejanzas y diferencias y termina con una síntesis que responda al objetivo.";
        break;

      case "summary":
        taskGuidance = "Resume las ideas principales sin cambiar el sentido del material. Distingue las ideas centrales de los detalles secundarios y no agregues información que no esté respaldada por el contenido.";
        break;

      case "explanation":
        taskGuidance = "Explica el tema paso a paso, define los conceptos importantes y utiliza ejemplos pertinentes para facilitar la comprensión.";
        break;

      case "creative":
        taskGuidance = "Desarrolla una propuesta original que respete la idea, el propósito, el tono y las condiciones indicadas en la solicitud.";
        break;

      case "problem":
        taskGuidance = "Resuelve la tarea paso a paso. Explica el razonamiento, muestra los procedimientos necesarios y comprueba el resultado cuando sea posible.";
        break;

      case "translation":
        taskGuidance = "Traduce conservando el significado, el tono y el contexto del texto original. No añadas contenido que no esté presente.";
        break;

      default:
        taskGuidance = "Responde directamente a la solicitud. Organiza la información de manera lógica, explica los puntos necesarios y evita desviarte del objetivo.";
    }

    sections.push("**Objetivo y tarea:**\n" + taskGuidance);

    if (!analysis.hasAudience) {
      sections.push(
        "**Público objetivo:**\nEstudiantes de enseñanza media. Utiliza lenguaje claro, adecuado a ese nivel, y explica los términos técnicos necesarios."
      );
    } else {
      sections.push(
        "**Público objetivo:**\nRespeta el público y el nivel de conocimientos indicados en la solicitud original."
      );
    }

    if (analysis.research) {
      const subjectIsClimateAndAnimal =
        /\b(cambio climatico|calentamiento global)\b/.test(t) &&
        /\b(animal|animales|especie|especies|pinguino|pinguinos|ave|aves|mamifero|mamiferos)\b/.test(t);

      if (subjectIsClimateAndAnimal) {
        sections.push(
          "**Aspectos que debes investigar:**\n- Cambios en el hábitat y las condiciones ambientales.\n- Efectos sobre la alimentación y la disponibilidad de recursos.\n- Cambios en los desplazamientos y el comportamiento.\n- Posibles consecuencias para la reproducción y la supervivencia.\n- Diferencias entre especies o poblaciones cuando exista evidencia suficiente."
        );
      } else {
        sections.push(
          "**Aspectos que debes desarrollar:**\n- Contexto y conceptos fundamentales del tema.\n- Factores, causas o procesos relevantes.\n- Consecuencias o efectos principales.\n- Ejemplos o casos concretos relacionados con la investigación."
        );
      }

      if (!analysis.hasSources) {
        sections.push(
          "**Fuentes y verificación:**\nUtiliza fuentes confiables y verificables. Identifica autor, institución y fecha. No inventes referencias y señala cuando la evidencia sea limitada o exista incertidumbre."
        );
      } else {
        sections.push(
          "**Fuentes y verificación:**\nUtiliza y cita las fuentes solicitadas. No inventes referencias y distingue los datos comprobados de las interpretaciones."
        );
      }

      if (!analysis.hasExamples) {
        sections.push(
          "**Ejemplos:**\nIncluye uno o dos ejemplos concretos que ayuden a comprender los hallazgos, si existe información fiable."
        );
      }
    } else if (analysis.comparison) {
      sections.push(
        "**Criterios de comparación:**\nUtiliza criterios equivalentes para todos los elementos y presenta las semejanzas y diferencias de forma ordenada."
      );
    } else if (analysis.creative) {
      sections.push(
        "**Criterios de creación:**\nMantén coherencia con el propósito original y respeta las características, el tono y las restricciones solicitadas."
      );
    }

    if (!analysis.hasFormat) {
      sections.push(
        "**Formato de respuesta:**\nPresenta un título, una introducción breve, apartados organizados y una conclusión. Ajusta la extensión a la complejidad de la tarea."
      );
    } else {
      sections.push(
        "**Formato de respuesta:**\nRespeta el formato indicado en la solicitud original."
      );
    }

    sections.push(
      "**Criterios de calidad:**\nNo inventes datos ni fuentes. Señala las limitaciones o incertidumbres relevantes. Mantén el tema, el enfoque y la intención de la solicitud original; no agregues asuntos ajenos."
    );

    return `PROMPT MEJORADO\n\n${raw}\n\n${sections.join("\n\n")}`;
  }

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
