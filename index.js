//music

document.addEventListener("DOMContentLoaded", function () {
    const musicLink = document.querySelector(".music-toggle");
    const music = document.getElementById("bg-music");
    const marquee = document.getElementById("status-marquee");

    if (!musicLink || !music || !marquee) return;

    const defaultText = marquee.innerHTML;

    music.loop = true; // optional

    musicLink.addEventListener("click", function (e) {
      e.preventDefault();

      if (music.paused) {
        music.play()
          .then(() => {
            marquee.innerHTML = "🎵 Playing Speed Demon by Justin Bieber";
          })
          .catch(err => console.error("Audio play failed:", err));
      } else {
        music.pause();
        marquee.innerHTML = defaultText; // restore original marquee text
      }
    });
  });


//confetti

(function () {
  const COLORS = ["#ff6b6b", "#ffd93d", "#6bcB77", "#4dabf7", "#845ef7", "#ff922b", "#f783ac"];
  const GRAVITY = 0.15;
  const DRAG = 0.985;
  const PARTICLE_COUNT = 140;
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const overlay = document.getElementById("confetti-overlay");
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0;
  let particles = [];
  let rafId = null;

  function resize() {
    W = Math.floor(window.innerWidth * dpr);
    H = Math.floor(window.innerHeight * dpr);
    canvas.width = W;
    canvas.height = H;
  }
  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor(x, y) {
      const angle = (Math.random() * Math.PI) - (Math.PI / 2); // left↔right cone
      const speed = 6 + Math.random() * 6;

      this.x = x;
      this.y = y;
      this.vx = Math.cos(angle) * speed * dpr;
      this.vy = Math.sin(angle) * speed * dpr - 2; // initial lift
      this.size = (6 + Math.random() * 6) * dpr;
      this.color = COLORS[(Math.random() * COLORS.length) | 0];
      this.rotation = Math.random() * Math.PI * 2;
      this.spin = (Math.random() * 0.2 - 0.1); // -0.1..0.1
      this.life = 80 + Math.random() * 60;
      this.shape = Math.random() < 0.5 ? "rect" : "circle";
    }
    update() {
      this.vx *= DRAG;
      this.vy *= DRAG;
      this.vy += GRAVITY * dpr;

      this.x += this.vx;
      this.y += this.vy;

      this.rotation += this.spin;
      this.life--;
    }
    draw(c) {
      c.save();
      c.translate(this.x, this.y);
      c.rotate(this.rotation);
      c.fillStyle = this.color;

      if (this.shape === "rect") {
        c.fillRect(-this.size * 0.5, -this.size * 0.35, this.size, this.size * 0.7);
      } else {
        c.beginPath();
        c.arc(0, 0, this.size * 0.45, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
    get dead() {
      return this.life <= 0 || this.y > H + this.size;
    }
  }

  function fireConfetti(clientX, clientY) {
    // Convert CSS pixels → canvas pixels
    const x = (clientX ?? window.innerWidth / 2) * dpr;
    const y = (clientY ?? window.innerHeight / 2) * dpr;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(new Particle(x, y));
    }
    start();
  }

  function start() {
    if (rafId != null) return; // already animating
    overlay.style.pointerEvents = "none";
    loop();
  }

  function loop() {
    rafId = requestAnimationFrame(loop);

    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.dead) particles.splice(i, 1);
    }

    if (particles.length === 0) {
      cancelAnimationFrame(rafId);
      rafId = null;
      ctx.clearRect(0, 0, W, H);
    }
  }

  document.addEventListener("click", (e) => {
    const finder = e.target.closest(".app.finder-toggle, .app .finder-img, .finder-toggle");
    if (!finder) return;
    e.preventDefault();
    fireConfetti(e.clientX, e.clientY);
  });

  window.fireConfetti = (x, y) => fireConfetti(x, y);
})();


//settings crash
document.addEventListener("DOMContentLoaded", () => {
  const settings = document.querySelector(".app.settings-toggle");

  settings.addEventListener("click", (e) => {
    e.preventDefault();
    
    const crash = document.createElement("div");
    crash.className = "crash-screen";
    crash.innerHTML = `
    💥 SYSTEM FAILURE 💥
    
    A fatal error has occurred
    [Restart your desktop]`

    document.body.appendChild(crash);

    // freeze all scrolling and interactions
    document.body.style.overflow = "hidden";
  });
});

//notion
document.addEventListener("DOMContentLoaded", () => {
  const notionIcon = document.querySelector(".notion-toggle");
  const popup = document.getElementById("instruction-popup");
  const closeBtn = popup.querySelector(".close-btn");

  notionIcon.addEventListener("click", (e) => {
    e.preventDefault();
    popup.style.display = "block";        // show popup
    popup.classList.remove("hide");       // if it was hidden
  });

  closeBtn.addEventListener("click", () => {
    popup.classList.add("hide");          // fade out (if you added transition)
    setTimeout(() => popup.style.display = "none", 400);
  });
});

//dashboard
document.addEventListener("DOMContentLoaded", () => {
  const dash = document.getElementById("dash-popup");
  const dashContent = document.getElementById("dash-content");
  const btnRefresh = document.getElementById("dash-refresh");
  const btnClose = document.getElementById("dash-close");
  const dashToggle = document.querySelector(".dash-toggle");

  function fmt(val, fallback = "—") {
    return (val !== undefined && val !== null) ? String(val) : fallback;
  }

  function nowLine() {
    const d = new Date();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `${d.toLocaleString()}  (${tz})`;
  }

  async function getBatteryLine() {
    try {
      if (!navigator.getBattery) return "Battery: Unsupported";
      const bat = await navigator.getBattery();
      const pct = Math.round(bat.level * 100) + "%";
      const chg = bat.charging ? "⚡ Charging" : "On battery";
      return `Battery: ${pct}  (${chg})`;
    } catch {
      return "Battery: Permission/Unsupported";
    }
  }

  function sysLinesBase() {
    const online = navigator.onLine ? "Online" : "Offline";
    const cores = fmt(navigator.hardwareConcurrency, "?");
    const mem = navigator.deviceMemory ? `${navigator.deviceMemory} GB (approx)` : "Unknown";
    const ua = navigator.userAgent.replace(/\s+/g, " ").slice(0, 80) + "…";

    const loadBar = (() => {
      const ms = performance.now() % 16.7;
      const pct = Math.min(100, Math.round((ms / 16.7) * 100));
      const bars = Math.round(pct / 10);
      return `[${"█".repeat(bars)}${" ".repeat(10 - bars)}] ${pct}%`;
    })();

    return [
      `System Status: STABLE`,
      `Time: ${nowLine()}`,
      `Network: ${online}`,
      `CPU Cores: ${cores}`,
      `Load: ${loadBar}`,
      `Memory: ${mem}`,
      `Agent: ${ua}`,
    ];
  }

  async function renderDashboard() {
    const lines = sysLinesBase();
    lines.push(await getBatteryLine());
    dashContent.textContent = lines.join("\n");
  }

  dashToggle?.addEventListener("click", (e) => {
    e.preventDefault();
    dash.style.display = "block";
    renderDashboard();
  });

  btnClose.addEventListener("click", () => (dash.style.display = "none"));
  btnRefresh.addEventListener("click", renderDashboard);

  let interval = null;
  const observer = new MutationObserver(() => {
    const visible = dash.style.display !== "none";
    if (visible && !interval) interval = setInterval(renderDashboard, 10000);
    if (!visible && interval) { clearInterval(interval); interval = null; }
  });
  observer.observe(dash, { attributes: true, attributeFilter: ["style"] });
});

//goodnotes
document.addEventListener("DOMContentLoaded", () => {
  const goodnotesBtn = document.querySelector(".goodnotes-toggle");
  const notesPopup = document.getElementById("notes-popup");
  const closeBtn = notesPopup.querySelector(".close-btn");
  const sendBtn = document.getElementById("notes-email");
  const notesTitle = document.getElementById("notes-title");
  const notesText = document.getElementById("notes-text");

  // Open popup
  goodnotesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    notesPopup.style.display = "block";
    notesPopup.classList.remove("hide");
  });

  // Close popup
  closeBtn.addEventListener("click", () => {
    notesPopup.classList.add("hide");
    setTimeout(() => (notesPopup.style.display = "none"), 300);
  });

  // Send email (opens user's default email client)
  sendBtn.addEventListener("click", () => {
    const name = notesTitle.value || "Anonymous";
    const message = notesText.value.trim();

    if (!message) {
      alert("Please write something before sending!");
      return;
    }

    const subject = encodeURIComponent(`Desktop Note from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— Sent from Miffy's Desktop`);
    const recipient = "miffy.yq.wang@yale.edu";

    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
  });
});

//cal
document.addEventListener("DOMContentLoaded", () => {
  const icalBtn   = document.querySelector(".ical-toggle");
  const icalPopup = document.getElementById("ical-popup");
  const icalClose = document.getElementById("ical-close");
  const icalList  = document.getElementById("ical-list");

  // 1) Configure your countdown events here:
  const EVENTS = [
    { title: "ART 3769 Webzine DUE",    date: "2025-10-06T06:30:00" },
    { title: "October Break!", date: "2025-10-14T02:15:00" },
    { title: "Miffy's Birthday", date: "2026-06-07T00:00:00" }
  ];

  // 2) Helpers
  function pad(n) { return String(n).padStart(2, "0"); }

  function diffParts(target) {
    const now = new Date().getTime();
    const t   = new Date(target).getTime();
    const ms  = t - now;

    if (ms <= 0) return { overdue: true, text: "🎉 It’s time!" };

    const sec  = Math.floor(ms / 1000);
    const days = Math.floor(sec / 86400);
    const hrs  = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s    = sec % 60;

    return { overdue: false, days, hrs, mins, s };
  }

  function render() {
    icalList.innerHTML = ""; // clear
    EVENTS.forEach(evt => {
      const row = document.createElement("div");
      row.className = "ical-row";

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = evt.title;

      const countdown = document.createElement("div");
      countdown.className = "countdown";
      countdown.dataset.date = evt.date;

      row.appendChild(title);
      row.appendChild(countdown);
      icalList.appendChild(row);
    });

    // Start updating
    tick(); // immediate paint
  }

  let timer = null;
  function tick() {
    const nodes = icalList.querySelectorAll(".countdown");
    nodes.forEach(n => {
      const target = n.dataset.date;
      const parts = diffParts(target);
      if (parts.overdue) {
        n.textContent = "🎉 It’s time!";
      } else {
        n.textContent = `${parts.days}d ${pad(parts.hrs)}h ${pad(parts.mins)}m ${pad(parts.s)}s`;
      }
    });
  }

  // Update every second while popup is open
  function start() {
    stop();
    timer = setInterval(tick, 1000);
  }
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  icalBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    icalPopup.style.display = "block";
    icalPopup.classList.remove("hide");
    render();
    start();
  });

  icalClose?.addEventListener("click", () => {
    icalPopup.classList.add("hide");
    stop();
    setTimeout(() => (icalPopup.style.display = "none"), 300);
  });
});

//guestbook
document.addEventListener("DOMContentLoaded", () => {
  const video   = document.getElementById("video");
  const canvas  = document.getElementById("canvas");
  const snapBtn = document.getElementById("snap");
  const gallery = document.getElementById("gallery");

  // 1) Start camera (HTTPS or http://localhost required)
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      video.srcObject = stream;
      // iOS/Safari needs these
      video.setAttribute("playsinline", "");
      await video.play();
      // Wait until we have real dimensions
      if (video.readyState < 2) {
        await new Promise(res => video.addEventListener("loadedmetadata", res, { once: true }));
      }
      snapBtn.disabled = false;
    } catch (err) {
      alert("Camera access denied or unavailable. Tip: use HTTPS or localhost.");
      console.error(err);
    }
  }

  // 2) Take photo (only when video has width/height)
  function takePhoto() {
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      console.warn("Video not ready yet (no dimensions).");
      return;
    }
    canvas.width  = vw;
    canvas.height = vh;

    const ctx = canvas.getContext("2d");
    // optional filters for vibe:
    // ctx.filter = "contrast(1.1) saturate(1.1)";
    ctx.drawImage(video, 0, 0, vw, vh);
    const dataUrl = canvas.toDataURL("image/png");

    // Thumbnail that downloads on click
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "Photobooth capture";
    img.title = "Click to download";
    img.addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `photo_${Date.now()}.png`;
      a.click();
    });

    gallery.prepend(img);
    gallery.scrollLeft = 0;
  }

  // Wire up
  snapBtn.disabled = true;
  snapBtn.addEventListener("click", takePhoto);
  startCamera();

  
}
);