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
  function improvedPrompt(original) {
  const raw = original.trim();
  const analysis = evaluatePrompt(raw);
  const t = analysis.text;
  const sections = [];

  // 1. Instrucciones específicas según la tarea
  const taskGuidance = {
    research:
      "Realiza una investigación organizada. Explica el contexto, los factores relevantes, sus causas y consecuencias. Distingue los hechos comprobados de las hipótesis.",

    comparison:
      "Compara los elementos solicitados utilizando criterios equivalentes. Explica semejanzas, diferencias, ventajas y desventajas, y termina con una conclusión basada en los criterios analizados.",

    summary:
      "Resume las ideas principales sin alterar el significado del contenido. Prioriza la información esencial y evita agregar datos que no estén presentes en el material original.",

    explanation:
      "Explica el tema paso a paso. Define los conceptos importantes, utiliza ejemplos pertinentes y adapta la profundidad de la explicación al público objetivo.",

    creative:
      "Desarrolla una creación original que respete la idea central, el género, el tono, los personajes y las condiciones indicadas. Mantén la coherencia del contenido.",

    problem:
      "Resuelve la tarea paso a paso. Explica el razonamiento, muestra los procedimientos necesarios y comprueba el resultado cuando sea posible.",

    translation:
      "Traduce conservando el significado, el tono y el contexto del texto original. Evita añadir o eliminar información."
  };

  sections.push(
    "**Objetivo y tarea:**\n" +
    (taskGuidance[analysis.type] ||
      "Responde directamente a la solicitud. Organiza la información de manera lógica y mantén el enfoque original.")
  );

  // 2. Público objetivo
  if (!analysis.hasAudience) {
    sections.push(
      "**Público objetivo:**\n" +
      "Estudiantes de enseñanza media. Utiliza un lenguaje claro y apropiado para ese nivel, explicando los términos técnicos cuando sea necesario."
    );
  } else {
    sections.push(
      "**Público objetivo:**\n" +
      "Respeta el público y el nivel de conocimientos indicados en la solicitud original."
    );
  }

  // 3. Investigación
  if (analysis.type === "research") {
    sections.push(
      "**Aspectos que debes investigar:**\n" +
      "- Contexto y conceptos fundamentales.\n" +
      "- Causas y factores relacionados.\n" +
      "- Consecuencias y efectos principales.\n" +
      "- Ejemplos o casos concretos.\n" +
      "- Diferencias entre grupos, lugares o periodos cuando corresponda."
    );

    sections.push(
      "**Fuentes y verificación:**\n" +
      "Utiliza fuentes confiables y verificables. Identifica autores, instituciones y fechas. No inventes referencias y señala las limitaciones de la evidencia disponible."
    );

    if (!analysis.hasScope) {
      sections.push(
        "**Delimitación:**\n" +
        "Define los aspectos más importantes del tema y evita abarcar información que no contribuya al objetivo."
      );
    }
  }

  // 4. Comparaciones
  else if (analysis.type === "comparison") {
    sections.push(
      "**Criterios de comparación:**\n" +
      "Utiliza los mismos criterios para todos los elementos. Expón semejanzas, diferencias, ventajas y desventajas sin favorecer injustificadamente una opción."
    );

    sections.push(
      "**Conclusión:**\n" +
      "Resume los resultados y explica qué opción resulta más adecuada según los criterios analizados."
    );
  }

  // 5. Creaciones literarias
  else if (analysis.type === "creative") {
    sections.push(
      "**Desarrollo creativo:**\n" +
      "Respeta el género, la idea central, los personajes y las condiciones establecidas. Desarrolla el contenido con originalidad y coherencia."
    );

    if (/\b(cuento|relato|historia|novela)\b/.test(t)) {
      sections.push(
        "**Estructura narrativa:**\n" +
        "- Inicio: presenta el escenario y los personajes.\n" +
        "- Desarrollo: construye el conflicto y desarrolla los acontecimientos.\n" +
        "- Desenlace: resuelve el conflicto de forma coherente.\n" +
        "Si se solicita misterio o sorpresa, construye pistas y prepara un desenlace que tenga sentido."
      );
    } else if (/\b(poema|poesia)\b/.test(t)) {
      sections.push(
        "**Criterios poéticos:**\n" +
        "Cuida las imágenes, el ritmo, el lenguaje y la expresión de emociones. Respeta las condiciones de estilo o estructura solicitadas."
      );
    } else if (/\b(guion|dialogo|escena)\b/.test(t)) {
      sections.push(
        "**Estructura del guion:**\n" +
        "Organiza las escenas y los diálogos de forma clara. Diferencia las intervenciones de los personajes y las indicaciones de acción."
      );
    }

    sections.push(
      "**Criterios de calidad creativa:**\n" +
      "Mantén la coherencia entre personajes, acontecimientos y escenario. Evita contradicciones y respeta el tono solicitado."
    );
  }

  // 6. Resúmenes
  else if (analysis.type === "summary") {
    sections.push(
      "**Criterios del resumen:**\n" +
      "Conserva las ideas centrales, elimina repeticiones y evita introducir información que no aparezca en el material original."
    );
  }

  // 7. Problemas y ejercicios
  else if (analysis.type === "problem") {
    sections.push(
      "**Comprobación:**\n" +
      "Explica los pasos utilizados y verifica que el resultado responda a la pregunta. Si faltan datos, indícalo en lugar de inventarlos."
    );
  }

  // 8. Traducciones
  else if (analysis.type === "translation") {
    sections.push(
      "**Fidelidad de la traducción:**\n" +
      "Conserva el sentido, el registro y las expresiones del original. Si una expresión tiene varios significados, utiliza el contexto para elegir la traducción adecuada."
    );
  }

  // 9. Formato: adaptar a la tarea
  if (analysis.type === "creative") {
    sections.push(
      "**Formato de respuesta:**\n" +
      "Entrega directamente la creación solicitada. Respeta la extensión, el género y la estructura narrativa indicados. No conviertas una historia, poema o cuento en un informe."
    );
  } else if (analysis.type === "comparison") {
    sections.push(
      "**Formato de respuesta:**\n" +
      "Presenta la comparación en una tabla cuando se solicite y añade la conclusión correspondiente."
    );
  } else if (analysis.type === "research") {
    sections.push(
      "**Formato de respuesta:**\n" +
      "Organiza la investigación con título, introducción, desarrollo por apartados, conclusión y referencias."
    );
  } else if (!analysis.hasFormat) {
    sections.push(
      "**Formato de respuesta:**\n" +
      "Utiliza una estructura clara y ordenada, adecuada al tipo de tarea. Ajusta la extensión a su complejidad."
    );
  } else {
    sections.push(
      "**Formato de respuesta:**\n" +
      "Respeta el formato, la organización y la extensión indicados en la solicitud original."
    );
  }

  // 10. Calidad: no imponer fuentes a tareas de ficción
  if (analysis.type === "research" || analysis.type === "explanation") {
    sections.push(
      "**Criterios de calidad:**\n" +
      "No inventes datos ni fuentes. Señala incertidumbres y diferencia los hechos comprobados de las interpretaciones."
    );
  } else if (analysis.type !== "creative") {
    sections.push(
      "**Criterios de calidad:**\n" +
      "Responde con precisión, evita contradicciones y mantén el enfoque de la solicitud original."
    );
  }

  return (
    "PROMPT MEJORADO\n\n" +
    raw +
    "\n\n" +
    sections.join("\n\n")
  );
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
