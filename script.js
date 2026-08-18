/* ============================================================
   ARCHIVO DIGITAL — Prom 2026
   script.js — interactividad general del sitio
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const SECTION_IDS = ['portada','microbit','python','seguidor','cinta','pinza'];
  const sections = SECTION_IDS.map(id => document.getElementById(id));

  /* ---------------------------------------------------------
     1. BARRA DE PROGRESO DE LECTURA + RIEL DE CIRCUITO
  --------------------------------------------------------- */
  const progressBar = document.getElementById('progressBar');
  const circuitPath = document.getElementById('circuitPath');
  const circuitLength = circuitPath ? circuitPath.getTotalLength() : 0;
  if (circuitPath) circuitPath.style.strokeDasharray = circuitLength;

  function updateProgress(){
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    progressBar.style.width = (ratio * 100) + '%';
    if (circuitPath){
      circuitPath.style.strokeDashoffset = circuitLength * (1 - ratio);
    }
  }

  /* ---------------------------------------------------------
     2. NAVBAR: fondo al hacer scroll + link activo + hamburguesa
  --------------------------------------------------------- */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('[data-nav]');
  const navToggle = document.getElementById('navToggle');
  const navLinksWrap = document.getElementById('navLinks');
  const circuitNodes = document.querySelectorAll('.circuit-node');
  const sectionIndicator = document.getElementById('sectionIndicator');

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navLinksWrap.classList.toggle('open');
  });
  navLinksWrap.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navToggle.classList.remove('open');
    navLinksWrap.classList.remove('open');
  }));

  let currentIndex = 0;

  function setActiveSection(id, index){
    navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
    circuitNodes.forEach(n => n.classList.toggle('active', n.dataset.section === id));
    currentIndex = index;
    sectionIndicator.textContent = String(index + 1).padStart(2,'0') + ' / ' + sections.length;
  }

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const id = entry.target.id;
        const index = SECTION_IDS.indexOf(id);
        setActiveSection(id, index);
      }
    });
  }, { threshold: 0.4 });
  sections.forEach(s => s && sectionObserver.observe(s));

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
    updateProgress();
  }, { passive: true });
  updateProgress();

  /* ---------------------------------------------------------
     3. BOTONES ANTERIOR / SIGUIENTE
  --------------------------------------------------------- */
  document.getElementById('prevSectionBtn').addEventListener('click', () => {
    const target = sections[Math.max(currentIndex - 1, 0)];
    target.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('nextSectionBtn').addEventListener('click', () => {
    const target = sections[Math.min(currentIndex + 1, sections.length - 1)];
    target.scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------------------------------------------------------
     4. REVEAL AL HACER SCROLL
  --------------------------------------------------------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------------------------------------------------------
     5. PARTÍCULAS DE LA PORTADA (canvas)
  --------------------------------------------------------- */
  const canvas = document.getElementById('particleCanvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resizeCanvas(){
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  function initParticles(){
    const count = Math.min(70, Math.floor(canvas.offsetWidth / 18));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.6 + 0.6
    }));
  }

  function drawParticles(){
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(61,123,255,0.55)';
      ctx.fill();
    });
    for (let i = 0; i < particles.length; i++){
      for (let j = i + 1; j < particles.length; j++){
        const a = particles[i], b = particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 120){
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = 'rgba(61,123,255,' + (0.16 * (1 - dist / 120)) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    if (!prefersReducedMotion) requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  initParticles();
  drawParticles();
  window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

  /* ---------------------------------------------------------
     6. ANIMACIÓN DE LEDS DE MICRO:BIT
  --------------------------------------------------------- */
  const ledGrid = document.querySelector('.mb-led-grid');
  if (ledGrid){
    for (let i = 0; i < 25; i++){
      const span = document.createElement('span');
      ledGrid.appendChild(span);
    }
    const leds = ledGrid.querySelectorAll('span');
    // patrón de "corazón" simple parpadeante estilo micro:bit
    const pattern = [1,3, 5,6,7,8,9, 11,12,13,14,15, 17,18,19, 21,22,23];
    let on = false;
    setInterval(() => {
      on = !on;
      leds.forEach((led, i) => led.classList.toggle('on', on && pattern.includes(i)));
    }, 900);
  }

  /* ---------------------------------------------------------
     6b. CONTADOR DE VEHÍCULOS (simulación micro:bit A / B)
  --------------------------------------------------------- */
  const counterLedGrid = document.getElementById('counterLedGrid');
  const btnA = document.getElementById('btnA');
  const btnB = document.getElementById('btnB');
  const btnAClick = document.getElementById('btnAClick');
  const btnBClick = document.getElementById('btnBClick');
  const btnABClick = document.getElementById('btnABClick');
  const btnResetClick = document.getElementById('btnResetClick');
  const motoCountEl = document.getElementById('motoCount');
  const carroCountEl = document.getElementById('carroCount');
  const totalCountEl = document.getElementById('totalCount');
  const counterStatus = document.getElementById('counterStatus');

  if (counterLedGrid){
    for (let i = 0; i < 25; i++){
      const span = document.createElement('span');
      counterLedGrid.appendChild(span);
    }
  }
  const counterLeds = counterLedGrid ? counterLedGrid.querySelectorAll('span') : [];

  // patrones simples de 5x5 para mostrar en la matriz de LEDs
  const LED_PATTERNS = {
    moto: [2, 6,8, 10,11,12,13,14, 16,18, 21,23],           // ícono simple de moto
    carro: [1,2,3, 5,9, 10,11,12,13,14, 16,20, 21,23],       // ícono simple de carro
    check: [4, 8, 12,16, 20, 0,6,12,18,24],                  // marca / confirmación
    off: []
  };

  let vehicleCounts = { moto: 0, carro: 0 };
  let ledTimeoutId = null;

  function flashLedPattern(patternName, duration = 900){
    if (!counterLeds.length) return;
    clearTimeout(ledTimeoutId);
    counterLeds.forEach((led, i) => led.classList.toggle('on', LED_PATTERNS[patternName].includes(i)));
    ledTimeoutId = setTimeout(() => {
      counterLeds.forEach(led => led.classList.remove('on'));
    }, duration);
  }

  function bump(el){
    el.classList.remove('bump');
    void el.offsetWidth; // reinicia la animación
    el.classList.add('bump');
  }

  function pressButtonVisual(btn){
    btn.classList.add('pressed');
    setTimeout(() => btn.classList.remove('pressed'), 200);
  }

  function addMoto(){
    vehicleCounts.moto += 1;
    motoCountEl.textContent = vehicleCounts.moto;
    bump(motoCountEl);
    flashLedPattern('moto');
    counterStatus.textContent = 'Botón A presionado: se registró una moto 🏍️';
    pressButtonVisual(btnA);
  }

  function addCarro(){
    vehicleCounts.carro += 1;
    carroCountEl.textContent = vehicleCounts.carro;
    bump(carroCountEl);
    flashLedPattern('carro');
    counterStatus.textContent = 'Botón B presionado: se registró un carro 🚗';
    pressButtonVisual(btnB);
  }

  function showResult(){
    const total = vehicleCounts.moto + vehicleCounts.carro;
    totalCountEl.textContent = total;
    bump(totalCountEl);
    flashLedPattern('check', 1400);
    counterStatus.textContent =
      `Resultado — 🏍️ Motos: ${vehicleCounts.moto} · 🚗 Carros: ${vehicleCounts.carro} · 🚦 Total: ${total}`;
    pressButtonVisual(btnA);
    pressButtonVisual(btnB);
  }

  function resetCounter(){
    vehicleCounts = { moto: 0, carro: 0 };
    motoCountEl.textContent = '0';
    carroCountEl.textContent = '0';
    totalCountEl.textContent = '0';
    flashLedPattern('off', 1);
    counterStatus.textContent = 'Contador reiniciado. Presiona A o B para empezar de nuevo';
  }

  if (btnA){
    btnA.addEventListener('click', addMoto);
    btnA.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addMoto(); } });
  }
  if (btnB){
    btnB.addEventListener('click', addCarro);
    btnB.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addCarro(); } });
  }
  if (btnAClick) btnAClick.addEventListener('click', addMoto);
  if (btnBClick) btnBClick.addEventListener('click', addCarro);
  if (btnABClick) btnABClick.addEventListener('click', showResult);
  if (btnResetClick) btnResetClick.addEventListener('click', resetCounter);

  /* ---------------------------------------------------------
     6c. CONTROLES DE TECLADO PARA EL CONTADOR MICRO:BIT
  --------------------------------------------------------- */
  const heldVehicleKeys = { a: false, b: false };
  let resultComboShown = false;

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key !== 'a' && key !== 'b') return;

    e.preventDefault();

    // No repetir la acción mientras la misma tecla permanezca presionada.
    if (heldVehicleKeys[key]) return;
    heldVehicleKeys[key] = true;

    if (heldVehicleKeys.a && heldVehicleKeys.b) {
      if (!resultComboShown) {
        showResult();
        resultComboShown = true;
      }
      return;
    }

    resultComboShown = false;
    if (key === 'a') addMoto();
    if (key === 'b') addCarro();
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (key !== 'a' && key !== 'b') return;

    heldVehicleKeys[key] = false;
    if (!heldVehicleKeys.a && !heldVehicleKeys.b) {
      resultComboShown = false;
    }
  });

  /* ---------------------------------------------------------
     7. MINI EDITOR DE PYTHON (soporta print() de forma segura)
  --------------------------------------------------------- */
  const pyInput = document.getElementById('pyInput');
  const pyOutput = document.getElementById('pyOutput');
  const runBtn = document.getElementById('runBtn');
  const clearBtn = document.getElementById('clearBtn');
  const quickExamples = document.getElementById('quickExamples');

  function runPythonSubset(code){
    const lines = code.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return { ok: true, text: '' };

    const outputLines = [];
    for (const line of lines){
      const match = line.match(/^print\((.*)\)$/s);
      if (!match){
        return {
          ok: false,
          text: `Error: solo se admite la instrucción print(). Revisa la línea:\n  ${line}`
        };
      }
      let arg = match[1].trim();

      // Cadena entre comillas simples o dobles
      const strMatch = arg.match(/^(['"])(.*)\1$/s);
      if (strMatch){
        outputLines.push(strMatch[2]);
        continue;
      }

      // Expresión numérica sencilla (solo dígitos, espacios y + - * / . () )
      if (/^[0-9+\-*/().\s]+$/.test(arg) && arg.length > 0){
        try {
          // eslint-disable-next-line no-new-func
          const value = Function('"use strict"; return (' + arg + ')')();
          outputLines.push(String(value));
          continue;
        } catch (e) {
          return { ok: false, text: `Error al evaluar la expresión: ${arg}` };
        }
      }

      return {
        ok: false,
        text: `Error: no se pudo interpretar "${arg}". Usa texto entre comillas o una operación numérica.`
      };
    }
    return { ok: true, text: outputLines.join('\n') };
  }

  function executeEditor(){
    const code = pyInput.value;
    const result = runPythonSubset(code);
    pyOutput.textContent = (result.ok ? '>>> ' : '') + (result.text || '(sin salida)');
    pyOutput.classList.toggle('is-error', !result.ok);
  }

  runBtn.addEventListener('click', executeEditor);
  clearBtn.addEventListener('click', () => {
    pyInput.value = '';
    pyOutput.textContent = '>>> Presiona "Ejecutar" para ver el resultado';
    pyOutput.classList.remove('is-error');
    pyInput.focus();
  });
  quickExamples.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    pyInput.value = chip.dataset.code;
    executeEditor();
  });

  /* ---------------------------------------------------------
     8. JUEGO: ROBOT SEGUIDOR DE LÍNEA
  --------------------------------------------------------- */
  const gameCanvas = document.getElementById('gameCanvas');
  const gctx = gameCanvas.getContext('2d');
  const gameOverlay = document.getElementById('gameOverlay');
  const gameOverlayText = document.getElementById('gameOverlayText');
  const gameStartBtn = document.getElementById('gameStartBtn');
  const gameScoreEl = document.getElementById('gameScore');
  const gameTimeEl = document.getElementById('gameTime');
  const gameLeftBtn = document.getElementById('gameLeft');
  const gameRightBtn = document.getElementById('gameRight');

  const GAME_DURATION = 30;
  let gameState = null;
  let gameLoopId = null;
  let gameTimerId = null;

  function makeTrack(){
    // genera puntos de la línea (una curva senoidal suave) y obstáculos
    const points = [];
    const w = gameCanvas.width;
    for (let x = 0; x <= w; x += 4){
      const y = 160 + Math.sin(x / 90) * 70 + Math.sin(x / 37) * 18;
      points.push({ x, y });
    }
    const obstacles = [];
    for (let i = 1; i <= 5; i++){
      const x = (w / 6) * i + (Math.random() * 40 - 20);
      const trackPoint = points[Math.min(points.length - 1, Math.round(x / 4))];
      obstacles.push({ x, y: trackPoint.y + (Math.random() > 0.5 ? -34 : 34), r: 12, passed: false });
    }
    return { points, obstacles };
  }

  function trackYAt(track, x){
    const idx = Math.min(track.points.length - 1, Math.max(0, Math.round(x / 4)));
    return track.points[idx].y;
  }

  function startGame(){
    const track = makeTrack();
    gameState = {
      track,
      robotX: 40,
      robotY: trackYAt(track, 40),
      offset: 0,          // desviación lateral respecto a la línea
      speed: 2.1,
      score: 0,
      timeLeft: GAME_DURATION,
      over: false,
      keys: { left: false, right: false }
    };
    gameScoreEl.textContent = '0';
    gameTimeEl.textContent = String(GAME_DURATION);
    gameOverlay.classList.add('hidden');

    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    if (gameTimerId) clearInterval(gameTimerId);

    gameTimerId = setInterval(() => {
      if (!gameState || gameState.over) return;
      gameState.timeLeft -= 1;
      gameTimeEl.textContent = String(Math.max(gameState.timeLeft, 0));
      if (gameState.timeLeft <= 0) endGame(true);
    }, 1000);

    gameLoop();
  }

  function endGame(won){
    if (!gameState) return;
    gameState.over = true;
    clearInterval(gameTimerId);
    gameOverlayText.textContent = won
      ? `¡Victoria! Mantuviste el robot en la línea. Puntos: ${gameState.score}`
      : `El robot se salió de la línea. Puntos: ${gameState.score}`;
    gameStartBtn.textContent = 'Jugar nuevamente';
    gameOverlay.classList.remove('hidden');
  }

  function gameLoop(){
    if (!gameState || gameState.over) return;
    const { track, keys } = gameState;

    // movimiento lateral controlado por el usuario
    if (keys.left) gameState.offset -= 2.4;
    if (keys.right) gameState.offset += 2.4;
    // el robot tiende a alejarse ligeramente de la línea (dificultad)
    gameState.offset += Math.sin(gameState.robotX / 60) * 0.35;

    gameState.robotX += gameState.speed;
    const lineY = trackYAt(track, gameState.robotX);
    gameState.robotY = lineY + gameState.offset;

    // ¿se salió de la línea?
    if (Math.abs(gameState.offset) > 55){
      endGame(false);
      return;
    }

    // puntaje por mantenerse cerca de la línea
    if (Math.abs(gameState.offset) < 15){
      gameState.score += 1;
      gameScoreEl.textContent = String(gameState.score);
    }

    // colisión con obstáculos
    track.obstacles.forEach(ob => {
      const dx = gameState.robotX - ob.x;
      const dy = gameState.robotY - ob.y;
      if (!ob.passed && Math.hypot(dx, dy) < ob.r + 10){
        endGame(false);
      }
      if (ob.x < gameState.robotX - 20) ob.passed = true;
    });

    if (gameState.robotX >= gameCanvas.width - 20){
      endGame(true);
      return;
    }

    drawGame();
    gameLoopId = requestAnimationFrame(gameLoop);
  }

  function drawGame(){
    const { track, robotX, robotY } = gameState;
    const w = gameCanvas.width, h = gameCanvas.height;
    gctx.clearRect(0, 0, w, h);

    // fondo
    gctx.fillStyle = '#0e1730';
    gctx.fillRect(0, 0, w, h);

    // línea de la pista
    gctx.beginPath();
    track.points.forEach((p, i) => i === 0 ? gctx.moveTo(p.x, p.y) : gctx.lineTo(p.x, p.y));
    gctx.strokeStyle = '#3D7BFF';
    gctx.lineWidth = 10;
    gctx.lineCap = 'round';
    gctx.globalAlpha = 0.25;
    gctx.stroke();
    gctx.globalAlpha = 1;
    gctx.lineWidth = 4;
    gctx.strokeStyle = '#8fb4ff';
    gctx.stroke();

    // obstáculos
    track.obstacles.forEach(ob => {
      gctx.beginPath();
      gctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2);
      gctx.fillStyle = '#f87171';
      gctx.fill();
    });

    // robot
    gctx.save();
    gctx.translate(robotX, robotY);
    gctx.fillStyle = '#ffffff';
    gctx.beginPath();
    gctx.roundRect ? gctx.roundRect(-14, -10, 28, 20, 6) : gctx.rect(-14, -10, 28, 20);
    gctx.fill();
    gctx.fillStyle = '#3D7BFF';
    gctx.beginPath();
    gctx.arc(10, 0, 4, 0, Math.PI * 2);
    gctx.fill();
    gctx.restore();
  }

  gameStartBtn.addEventListener('click', startGame);

  function setDir(dir, active){
    if (!gameState) return;
    gameState.keys[dir] = active;
  }
  gameLeftBtn.addEventListener('mousedown', () => setDir('left', true));
  gameLeftBtn.addEventListener('mouseup', () => setDir('left', false));
  gameLeftBtn.addEventListener('mouseleave', () => setDir('left', false));
  gameRightBtn.addEventListener('mousedown', () => setDir('right', true));
  gameRightBtn.addEventListener('mouseup', () => setDir('right', false));
  gameRightBtn.addEventListener('mouseleave', () => setDir('right', false));
  gameLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDir('left', true); });
  gameLeftBtn.addEventListener('touchend', () => setDir('left', false));
  gameRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setDir('right', true); });
  gameRightBtn.addEventListener('touchend', () => setDir('right', false));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') setDir('left', true);
    if (e.key === 'ArrowRight') setDir('right', true);
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') setDir('left', false);
    if (e.key === 'ArrowRight') setDir('right', false);
  });

  /* ---------------------------------------------------------
     9. SIMULACIÓN DE LA PINZA
  --------------------------------------------------------- */
  const clawLeft = document.getElementById('clawLeft');
  const clawRight = document.getElementById('clawRight');
  const gripperObject = document.getElementById('gripperObject');
  const gripperStatus = document.getElementById('gripperStatus');

  const CLAW_OPEN = { left: 'M200,130 C170,120 150,90 155,60', right: 'M200,130 C230,120 250,90 245,60' };
  const CLAW_CLOSED = { left: 'M200,130 C185,120 178,95 185,72', right: 'M200,130 C215,120 222,95 215,72' };

  let clawOpen = true;
  let holdingObject = false;

  function updateGripperStatus(){
    let text = 'Estado: pinza ' + (clawOpen ? 'abierta' : 'cerrada') + ', ';
    text += holdingObject ? 'sosteniendo el objeto' : 'sin objeto';
    gripperStatus.textContent = text;
  }

  document.getElementById('openClaw').addEventListener('click', () => {
    clawOpen = true;
    clawLeft.setAttribute('d', CLAW_OPEN.left);
    clawRight.setAttribute('d', CLAW_OPEN.right);
    if (holdingObject){
      holdingObject = false;
      gripperObject.setAttribute('cy', 55);
      gripperObject.style.opacity = 1;
    }
    updateGripperStatus();
  });

  document.getElementById('closeClaw').addEventListener('click', () => {
    clawOpen = false;
    clawLeft.setAttribute('d', CLAW_CLOSED.left);
    clawRight.setAttribute('d', CLAW_CLOSED.right);
    updateGripperStatus();
  });

  document.getElementById('grabObject').addEventListener('click', () => {
    clawOpen = false;
    clawLeft.setAttribute('d', CLAW_CLOSED.left);
    clawRight.setAttribute('d', CLAW_CLOSED.right);
    holdingObject = true;
    gripperObject.setAttribute('cy', 70);
    updateGripperStatus();
  });

  document.getElementById('releaseObject').addEventListener('click', () => {
    if (holdingObject){
      holdingObject = false;
      clawOpen = true;
      clawLeft.setAttribute('d', CLAW_OPEN.left);
      clawRight.setAttribute('d', CLAW_OPEN.right);
      gripperObject.setAttribute('cy', 55);
      updateGripperStatus();
    }
  });

  updateGripperStatus();


  /* ---------------------------------------------------------
     10. MINI JUEGO: RETO PYTHON
  --------------------------------------------------------- */
  const pyQuestionEl = document.getElementById('pyQuestion');
  const pyOptionsEl = document.getElementById('pyOptions');
  const pyScoreEl = document.getElementById('pyGameScore');
  const pyFeedbackEl = document.getElementById('pyFeedback');
  const pyRestartBtn = document.getElementById('pyRestart');

  const PY_QUESTIONS = [
    { code: 'print("Hola")', options: ['Hola','print("Hola")','Error'], answer: 'Hola' },
    { code: 'print(2 + 3)', options: ['23','5','2 + 3'], answer: '5' },
    { code: 'print("Prom 2026")', options: ['Prom 2026','Python','2026'], answer: 'Prom 2026' }
  ];
  let pyGameIndex = 0, pyGameScore = 0, pyLocked = false;

  function renderPyQuestion(){
    if (!pyQuestionEl) return;
    const q = PY_QUESTIONS[pyGameIndex];
    pyQuestionEl.textContent = q.code;
    pyOptionsEl.innerHTML = '';
    q.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'challenge-option';
      btn.textContent = option;
      btn.addEventListener('click', () => answerPy(option, btn));
      pyOptionsEl.appendChild(btn);
    });
    pyFeedbackEl.textContent = `Pregunta ${pyGameIndex + 1} de ${PY_QUESTIONS.length}`;
    pyLocked = false;
  }

  function answerPy(option, button){
    if (pyLocked) return;
    pyLocked = true;
    const q = PY_QUESTIONS[pyGameIndex];
    if (option === q.answer){
      pyGameScore += 1;
      pyFeedbackEl.textContent = '¡Correcto! 🎉';
      button.classList.add('correct');
    } else {
      pyFeedbackEl.textContent = `No exactamente. La respuesta correcta es: ${q.answer}`;
      button.classList.add('wrong');
    }
    pyScoreEl.textContent = pyGameScore;
    setTimeout(() => {
      pyGameIndex += 1;
      if (pyGameIndex < PY_QUESTIONS.length) {
        renderPyQuestion();
      } else {
        pyQuestionEl.textContent = pyGameScore === 3 ? '¡Reto superado!' : 'Reto terminado';
        pyOptionsEl.innerHTML = '';
        pyFeedbackEl.textContent = `Obtuviste ${pyGameScore}/3 puntos. Presiona Reiniciar reto para jugar otra vez.`;
      }
    }, 650);
  }

  if (pyRestartBtn){
    pyRestartBtn.addEventListener('click', () => {
      pyGameIndex = 0; pyGameScore = 0; pyScoreEl.textContent = '0'; renderPyQuestion();
    });
    renderPyQuestion();
  }

  /* ---------------------------------------------------------
     11. MINI JUEGO: CLASIFICACIÓN EN CINTA TRANSPORTADORA
  --------------------------------------------------------- */
  const conveyorStart = document.getElementById('conveyorStart');
  const conveyorScoreEl = document.getElementById('conveyorScore');
  const conveyorFeedback = document.getElementById('conveyorFeedback');
  const sortingPackage = document.getElementById('sortingPackage');
  const sortButtons = document.querySelectorAll('.sort-btn');
  const packageTypes = [
    { icon:'📦', type:'caja', name:'Caja' },
    { icon:'⚙️', type:'pieza', name:'Pieza' },
    { icon:'🔵', type:'sensor', name:'Sensor' }
  ];
  let conveyorRunning = false, conveyorScore = 0, currentPackage = null, conveyorTimeout = null;

  function nextPackage(){
    if (!conveyorRunning) return;
    currentPackage = packageTypes[Math.floor(Math.random() * packageTypes.length)];
    sortingPackage.textContent = currentPackage.icon;
    sortingPackage.classList.remove('sorting-move');
    void sortingPackage.offsetWidth;
    sortingPackage.classList.add('sorting-move');
    conveyorFeedback.textContent = `Clasifica: ${currentPackage.name}`;
    clearTimeout(conveyorTimeout);
    conveyorTimeout = setTimeout(() => {
      if (!conveyorRunning) return;
      conveyorFeedback.textContent = '¡Se escapó un paquete! Intenta de nuevo.';
      conveyorRunning = false;
      conveyorStart.textContent = 'Jugar de nuevo';
    }, 5000);
  }

  if (conveyorStart){
    conveyorStart.addEventListener('click', () => {
      conveyorRunning = true;
      conveyorScore = 0;
      conveyorScoreEl.textContent = '0';
      conveyorStart.textContent = 'Reiniciar';
      nextPackage();
    });
  }

  sortButtons.forEach(btn => btn.addEventListener('click', () => {
    if (!conveyorRunning || !currentPackage) return;
    if (btn.dataset.type === currentPackage.type){
      conveyorScore += 1;
      conveyorScoreEl.textContent = conveyorScore;
      conveyorFeedback.textContent = '¡Bien! El paquete fue clasificado correctamente. 📦';
      clearTimeout(conveyorTimeout);
      setTimeout(nextPackage, 350);
    } else {
      conveyorFeedback.textContent = 'Clasificación incorrecta. Observa el tipo de paquete e inténtalo de nuevo.';
    }
  }));

  /* ---------------------------------------------------------
     12. MINI JUEGO: MISIÓN DE LA PINZA
  --------------------------------------------------------- */
  const missionScoreEl = document.getElementById('gripperMissionScore');
  const missionFeedback = document.getElementById('gripperMissionFeedback');
  const missionSteps = {
    open: document.getElementById('stepOpen'),
    grab: document.getElementById('stepGrab'),
    release: document.getElementById('stepRelease')
  };
  const missionReset = document.getElementById('gripperMissionReset');
  let missionStep = 0;

  function resetMission(){
    missionStep = 0;
    Object.values(missionSteps).forEach(el => el.classList.remove('done'));
    missionScoreEl.textContent = '0/3';
    missionFeedback.textContent = 'Misión pendiente: comienza abriendo la pinza.';
  }

  function missionDone(name){
    if (missionStep === 0 && name === 'open') missionStep = 1;
    else if (missionStep === 1 && name === 'grab') missionStep = 2;
    else if (missionStep === 2 && name === 'release') missionStep = 3;
    else return;

    const key = name;
    missionSteps[key].classList.add('done');
    missionScoreEl.textContent = `${missionStep}/3`;
    missionFeedback.textContent = missionStep === 3
      ? '¡Misión completada! El objeto fue rescatado y entregado. 🤖'
      : `Paso ${missionStep}/3 completado. Continúa con el siguiente movimiento.`;
  }

  document.getElementById('openClaw').addEventListener('click', () => missionDone('open'));
  document.getElementById('grabObject').addEventListener('click', () => missionDone('grab'));
  document.getElementById('releaseObject').addEventListener('click', () => missionDone('release'));
  if (missionReset) missionReset.addEventListener('click', resetMission);
  resetMission();

});
