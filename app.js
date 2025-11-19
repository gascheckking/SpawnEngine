// Simple global state
const state = {
  wallet: null,      // shortened display
  walletFull: null,  // full address (for real onchain queries later)
  theme: "dark",
  verified: {
    x: false,
    farcaster: false,
    base: false,
  },
};

// Helpers
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

/* --------------------------------------------------
   Unified activity (mock for now)
   -------------------------------------------------- */

async function getUnifiedActivity(wallet, contracts) {
  // contracts = array of TokenPackSeries addresses later
  // For now: mocked data merged from “sources”
  const now = new Date().toISOString().slice(11, 19);

  const events = [
    {
      source: "Base · TokenPackSeries",
      text: "Opened Tiny Legends 2 → Mythic hit (x200) on Base",
      time: now,
    },
    {
      source: "Vibe.market",
      text: "Sold 3× Foil Realms boosterpacks via Wield pool",
      time: "5 min ago",
    },
    {
      source: "Zora",
      text: "Minted Rodeo drop linked to PackMesh contract",
      time: "18 min ago",
    },
    {
      source: "Farcaster",
      text: "Cast tipped 12× for sharing a PackMesh pull clip",
      time: "32 min ago",
    },
    {
      source: "The Base App",
      text: "Bridge in +0.42 ETH to fuel pack openings",
      time: "1 h ago",
    },
    {
      source: "Rodeo.club",
      text: "High-score run with Tiny Legends 2 cards",
      time: "2 h ago",
    },
  ];

  return {
    wallet,
    contracts,
    events,
  };
}

async function loadUnifiedFeed() {
  if (!state.walletFull) return;

  const contracts = []; // later: array of TokenPackSeries contract addresses

  try {
    const data = await getUnifiedActivity(state.walletFull, contracts);
    console.log("Unified activity:", data);

    const list = $("#unified-feed");
    if (!list) return;

    list.innerHTML = data.events
      .map(
        (e) => `
        <div class="activity-item">
          <div class="activity-main">
            <div class="activity-wallet">${e.source}</div>
            <div class="activity-pack">${e.text}</div>
          </div>
          <div class="activity-meta">${e.time}</div>
        </div>
      `
      )
      .join("");
  } catch (err) {
    console.error("Unified feed error", err);
  }
}

/* --------------------------------------------------
   Tabs
   -------------------------------------------------- */

function initTabs() {
  const tabs = $$(".tab-button");
  const views = $$(".view");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const viewId = tab.dataset.view;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      views.forEach((v) => v.classList.remove("active"));
      $("#" + viewId).classList.add("active");
    });
  });

  const first = $(".tab-button");
  if (first) first.click();
}

/* --------------------------------------------------
   Ticker
   -------------------------------------------------- */

function initTicker() {
  const el = $("#ticker-text");
  if (!el) return;

  const messages = [
    "PackMesh online · watching Base pull activity…",
    "Tiny Legends 2 · Foil Realms · Mad Myth · Aura Maxxed",
    "Luckiest pull: Mythic Foil at $0.12 → floor $24.20",
    "Unlucky survivor: 0xdead…beef · 0 / 400 legends pulled",
  ];

  el.textContent = messages.join("   •   ");
}

/* --------------------------------------------------
   Dummy data
   -------------------------------------------------- */

const demoPacks = [
  {
    name: "Tiny Legends 2",
    creator: "spawnizz",
    price: "$0.24",
    supply: "42 designs",
    tags: ["verified", "bounty", "new"],
  },
  {
    name: "Foil Realms",
    creator: "spawnizz",
    price: "$0.28",
    supply: "36 designs",
    tags: ["verified"],
  },
  {
    name: "Aura Maxxed",
    creator: "spawnizz",
    price: "$0.46",
    supply: "24 designs",
    tags: ["new"],
  },
  {
    name: "Mad Myth",
    creator: "spawnizz",
    price: "$0.22",
    supply: "18 designs",
    tags: [],
  },
];

const demoInventory = [
  { name: "Tiny Legends 2", status: "for-trade", rarity: "legendary", value: "$68.00" },
  { name: "Foil Realms", status: "sealed", rarity: "mythic", value: "$32.00" },
  { name: "Mad Myth", status: "for-trade", rarity: "rare", value: "$4.20" },
  { name: "Chaos Draft", status: "grail", rarity: "legendary", value: "$120.00" },
];

const luckiestPulls = [
  { wallet: "0x596a…08ff", pack: "Tiny Legends 2", hit: "Mythic", spent: "$12", value: "$420" },
  { wallet: "0xfeet…sn1ff", pack: "Foil Realms", hit: "Legendary Foil", spent: "$3", value: "$96" },
  { wallet: "0x1337…c0de", pack: "Mad Myth", hit: "Full set", spent: "$48", value: "$200" },
];

const unluckyPulls = [
  { wallet: "0xdead…beef", pack: "Tiny Legends 2", hit: "0 / 400 legends", spent: "$96", value: "$40" },
  { wallet: "0x0bad…luck", pack: "Foil Realms", hit: "Commons only", spent: "$32", value: "$10" },
];

const statsWallets = [
  { wallet: "0x596a…08ff", score: "9.8", pulls: 420, legends: 16 },
  { wallet: "0xfeet…sn1ff", score: "9.1", pulls: 260, legends: 9 },
  { wallet: "0x1337…c0de", score: "8.7", pulls: 180, legends: 6 },
];

/* --------------------------------------------------
   Rendering helpers
   -------------------------------------------------- */

function renderTrading() {
  const grid = $("#trading-grid");
  if (!grid) return;

  const activeFilter =
    $("#trading-filters .filter-chip.active")?.dataset.filter || "all";

  const filtered = demoPacks.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "verified") return p.tags.includes("verified");
    if (activeFilter === "new") return p.tags.includes("new");
    if (activeFilter === "bounty") return p.tags.includes("bounty");
    return true;
  });

  grid.innerHTML = filtered
    .map((p) => {
      const badges = [];
      if (p.tags.includes("verified"))
        badges.push('<span class="badge badge-verified">Verified</span>');
      if (p.tags.includes("new"))
        badges.push('<span class="badge badge-new">New</span>');
      if (p.tags.includes("bounty"))
        badges.push('<span class="badge badge-bounty">Bounty</span>');

      return `
        <article class="pack-card">
          <div class="pack-header">
            <div class="pack-title">${p.name}</div>
            <div class="pack-meta">
              <span class="pack-price">${p.price}</span>
              <span class="pack-creator">by ${p.creator}</span>
            </div>
          </div>
          <div class="pack-badges">${badges.join("")}</div>
          <div class="card-actions">
            <button class="btn-mini">View</button>
            <button class="btn-mini">Open</button>
            <button class="btn-mini">Trade</button>
          </div>
        </article>
      `;
    })
    .join("");

  const metrics = $("#trading-metrics");
  if (metrics) {
    metrics.innerHTML = `
      <div class="metric-card">
        <div class="metric-label">Live floor (mock)</div>
        <div class="metric-value">$0.22 → $0.46</div>
        <div class="metric-sub">Tiny Legends 2 & Aura Maxxed currently dominate.</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">24h pulls (mock)</div>
        <div class="metric-value">3 240 packs</div>
        <div class="metric-sub">PackMesh wallets account for 18%.</div>
      </div>
    `;
  }
}

function renderInventory() {
  const grid = $("#inventory-grid");
  if (!grid) return;

  const activeFilter =
    $("#inventory-filters .filter-chip.active")?.dataset.filter || "all";

  const filtered = demoInventory.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "for-trade") return p.status === "for-trade";
    if (activeFilter === "sealed") return p.status === "sealed";
    if (activeFilter === "grail") return p.status === "grail";
    return true;
  });

  grid.innerHTML = filtered
    .map(
      (p) => `
      <article class="pack-card">
        <div class="pack-header">
          <div class="pack-title">${p.name}</div>
          <div class="pack-meta">
            <span>${p.value}</span>
            <span class="pack-creator">${p.status.toUpperCase()}</span>
          </div>
        </div>
        <div class="pack-badges">
          <span class="badge badge-supply">${p.rarity}</span>
        </div>
        <div class="card-actions">
          <button class="btn-mini">List</button>
          <button class="btn-mini">Mark as Grail</button>
        </div>
      </article>
    `
    )
    .join("");

  const metrics = $("#inventory-metrics");
  if (metrics) {
    const total = demoInventory.length;
    const legends = demoInventory.filter((p) => p.rarity === "legendary").length;
    metrics.innerHTML = `
      <div class="metric-card">
        <div class="metric-label">Total packs</div>
        <div class="metric-value">${total}</div>
        <div class="metric-sub">Mock count for UI.</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Legendaries</div>
        <div class="metric-value">${legends}</div>
        <div class="metric-sub">Foils show up once we connect real data.</div>
      </div>
    `;
  }
}

function renderLuckTables() {
  const tblLuck = $("#table-luckiest");
  const tblUnlucky = $("#table-unlucky");
  if (tblLuck) {
    tblLuck.innerHTML =
      `<tr><th>Wallet</th><th>Pack</th><th>Hit</th><th>Spent</th><th>Now worth</th></tr>` +
      luckiestPulls
        .map(
          (r) =>
            `<tr><td>${r.wallet}</td><td>${r.pack}</td><td>${r.hit}</td><td>${r.spent}</td><td>${r.value}</td></tr>`
        )
        .join("");
  }
  if (tblUnlucky) {
    tblUnlucky.innerHTML =
      `<tr><th>Wallet</th><th>Pack</th><th>Result</th><th>Spent</th></tr>` +
      unluckyPulls
        .map(
          (r) =>
            `<tr><td>${r.wallet}</td><td>${r.pack}</td><td>${r.hit}</td><td>${r.spent}</td></tr>`
        )
        .join("");
  }
}

function renderStats() {
  const metrics = $("#stats-metrics");
  if (metrics) {
    metrics.innerHTML = `
      <div class="metric-card">
        <div class="metric-label">PackMesh XP (mock)</div>
        <div class="metric-value">524.6K XP</div>
        <div class="metric-sub">Inspired by Vibe, but your own XP system.</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Daily pulls (mock)</div>
        <div class="metric-value">1 120</div>
        <div class="metric-sub">Will become live once we connect APIs.</div>
      </div>
    `;
  }

  const tbl = $("#stats-top-wallets");
  if (tbl) {
    tbl.innerHTML =
      `<tr><th>Wallet</th><th>Pull score</th><th>Pulls</th><th>Legends</th></tr>` +
      statsWallets
        .map(
          (w) =>
            `<tr><td>${w.wallet}</td><td>${w.score}</td><td>${w.pulls}</td><td>${w.legends}</td></tr>`
        )
        .join("");
  }
}

function renderVerified() {
  const grid = $("#verified-grid");
  if (!grid) return;

  const statusChip = (ok) =>
    ok
      ? '<span class="badge badge-verified">Linked</span>'
      : '<span class="badge">Not linked</span>';

  grid.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">X (Twitter)</div>
      <div class="metric-value">Identity Sync</div>
      <div class="metric-sub">Status: ${statusChip(state.verified.x)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Farcaster</div>
      <div class="metric-value">Warp handle</div>
      <div class="metric-sub">Status: ${statusChip(state.verified.farcaster)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Base App</div>
      <div class="metric-value">Onchain history</div>
      <div class="metric-sub">Status: ${statusChip(state.verified.base)}</div>
    </div>
  `;
}

function renderDeploy() {
  const grid = $("#deploy-grid");
  if (!grid) return;

  const cards = [
    {
      title: "Vibe-style Pack NFTs",
      desc: "Boosterbox / Wield-pack compatible series.",
      id: "pack",
    },
    {
      title: "Reward Token (ERC20)",
      desc: "XP / points / bonus tokens for your collectors.",
      id: "token",
    },
    {
      title: "Lootbox / Airdrop ERC1155",
      desc: "Batch drops, mystery loot & event rewards.",
      id: "loot",
    },
    {
      title: "Utility / Access NFT",
      desc: "Passes for miniapps, Discord or special drops.",
      id: "utility",
    },
  ];

  grid.innerHTML = cards
    .map(
      (c) => `
      <article class="pack-card">
        <div class="pack-header">
          <div class="pack-title">${c.title}</div>
        </div>
        <div class="pack-badges">
          <span class="badge badge-supply">Deploy mode</span>
        </div>
        <p class="metric-sub">${c.desc}</p>
        <div class="card-actions">
          <button class="btn-mini" data-deploy="${c.id}">Prepare Deploy</button>
        </div>
      </article>
    `
    )
    .join("");

  grid.querySelectorAll("[data-deploy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deploy;
      alert(
        `Deploy mode "${id}" is UI mock for now.\n\nOnce the Hardhat scripts are wired we trigger /scripts/deploy*.ts from here.`
      );
    });
  });
}

/* --------------------------------------------------
   Luck meter
   -------------------------------------------------- */

function initLuckMeter() {
  const fill = $("#luck-fill");
  const label = $("#luck-label");
  if (!fill || !label) return;

  function update() {
    const value = Math.floor(30 + Math.random() * 60); // 30–90%
    fill.style.width = value + "%";
    label.textContent = `Luck (mock): ${value}% · will move live when you open packs.`;
  }

  update();
  setInterval(update, 3500);
}

/* --------------------------------------------------
   Pack map (canvas)
   -------------------------------------------------- */

function initPackMap() {
  const canvas = document.getElementById("pack-map-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    draw();
  };

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nodes = [
      { x: 80, y: 120, r: 26, color: "#3dffb8", label: "TL2" },
      { x: 200, y: 80, r: 22, color: "#ff1744", label: "Foil" },
      { x: 300, y: 150, r: 18, color: "#ffeb3b", label: "Aura" },
      { x: 180, y: 200, r: 20, color: "#7c4dff", label: "Myth" },
    ];

    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      ctx.lineTo(nodes[i].x, nodes[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    nodes.forEach((n) => {
      const gradient = ctx.createRadialGradient(
        n.x - 4,
        n.y - 6,
        4,
        n.x,
        n.y,
        n.r
      );
      gradient.addColorStop(0, "#ffffff");
      gradient.addColorStop(0.4, n.color);
      gradient.addColorStop(1, "rgba(0,0,0,0.9)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(n.label, n.x, n.y + n.r + 12);
    });
  }

  resize();
  window.addEventListener("resize", resize);
}

/* --------------------------------------------------
   Chat
   -------------------------------------------------- */

function initChat() {
  const box = $("#chat-messages");
  const input = $("#chat-input");
  const send = $("#chat-send");
  if (!box || !input || !send) return;

  function addMessage(from, text) {
    const div = document.createElement("div");
    div.className = "msg";
    div.innerHTML = `<div class="msg-from">${from}</div><div class="msg-text">${text}</div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  send.addEventListener("click", () => {
    const v = input.value.trim();
    if (!v) return;
    addMessage(state.wallet || "you · 0x…", v);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send.click();
    }
  });

  addMessage(
    "system",
    "Wallet-to-wallet chat will live here — currently mocked messages."
  );
}

/* --------------------------------------------------
   Wallet & theme
   -------------------------------------------------- */

function updateWalletUI() {
  const statusWallet = $("#status-wallet");
  const settingsWallet = $("#settings-wallet");
  if (statusWallet) statusWallet.textContent = state.wallet || "Not connected";
  if (settingsWallet)
    settingsWallet.textContent = state.wallet
      ? `Connected: ${state.wallet}`
      : "Not connected.";
}

function initWalletButtons() {
  const mainBtn = $("#btn-connect");
  const setConnect = $("#btn-settings-connect");
  const setDisconnect = $("#btn-settings-disconnect");

  function connect() {
    // Mock full address; later replace with real signer.getAddress()
    state.walletFull = "0x596a00000000000000000000000000000008ff";
    state.wallet =
      state.walletFull.slice(0, 6) + "…" + state.walletFull.slice(-4);
    updateWalletUI();
    $("#status-sync").textContent = "synced (mock)";
    loadUnifiedFeed();
  }

  function disconnect() {
    state.wallet = null;
    state.walletFull = null;
    updateWalletUI();
    $("#status-sync").textContent = "waiting…";
    const feed = $("#unified-feed");
    if (feed) feed.innerHTML = "";
  }

  [mainBtn, setConnect].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (state.wallet) {
        alert("Wallet already mocked as connected.");
      } else {
        connect();
      }
    });
  });

  if (setDisconnect) setDisconnect.addEventListener("click", disconnect);
}

function initTheme() {
  const previews = $$(".theme-preview");
  const statusTheme = $("#status-theme");

  previews.forEach((p) => {
    p.addEventListener("click", () => {
      const theme = p.dataset.theme;
      if (theme !== "dark") {
        alert(
          "Only dark theme is active right now. Light will become an editor mode later."
        );
        return;
      }
      previews.forEach((x) => x.classList.remove("active"));
      p.classList.add("active");
      state.theme = theme;
      if (statusTheme) statusTheme.textContent = "Dark";
      document.documentElement.style.backgroundColor = "#03010b";
    });
  });
}

/* --------------------------------------------------
   Verified buttons
   -------------------------------------------------- */

function initVerifiedButtons() {
  const btnX = $("#btn-verify-x");
  const btnFc = $("#btn-verify-fc");
  const btnBase = $("#btn-verify-base");

  if (btnX)
    btnX.addEventListener("click", () => {
      state.verified.x = true;
      alert("Mock: X account linked.");
      renderVerified();
    });
  if (btnFc)
    btnFc.addEventListener("click", () => {
      state.verified.farcaster = true;
      alert("Mock: Farcaster handle linked.");
      renderVerified();
    });
  if (btnBase)
    btnBase.addEventListener("click", () => {
      state.verified.base = true;
      alert("Mock: Base activity verified.");
      renderVerified();
    });
}

/* --------------------------------------------------
   Filters
   -------------------------------------------------- */

function initFilters() {
  $("#trading-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    $$("#trading-filters .filter-chip").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
    renderTrading();
  });

  $("#inventory-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    $$("#inventory-filters .filter-chip").forEach((b) =>
      b.classList.remove("active")
    );
    btn.classList.add("active");
    renderInventory();
  });
}

/* --------------------------------------------------
   Creator Forge buttons
   -------------------------------------------------- */

function initCreatorForge() {
  $("#btn-upload-mock")?.addEventListener("click", () => {
    alert("Mock: 42 images ‘uploaded’ into Creator Forge.");
    $("#forge-rarity-dist").textContent =
      "Common 15 · Rare 14 · Epic 6 · Legendary 6 · Mythic 1";
  });

  $("#btn-generate-rarity")?.addEventListener("click", () => {
    alert("Mock: Rarity distribution calculated.");
    $("#forge-rarity-dist").textContent =
      "Common 60% · Rare 25% · Epic 10% · Legendary 4% · Mythic 1%";
  });

  $("#btn-generate-foil")?.addEventListener("click", () => {
    alert(
      "Mock: Foil previews generated (Base Shine · Toxic · Neon Prism)."
    );
  });
}

/* --------------------------------------------------
   Init
   -------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initTicker();
  initFilters();
  renderTrading();
  renderInventory();
  renderLuckTables();
  renderStats();
  renderVerified();
  renderDeploy();
  initLuckMeter();
  initPackMap();
  initChat();
  initWalletButtons();
  initTheme();
  initVerifiedButtons();
  initCreatorForge();
  updateWalletUI();
});