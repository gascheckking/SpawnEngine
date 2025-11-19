import { getUnifiedActivity } from "./services/activity.js";

async function loadUnifiedFeed() {
  const wallet = "0x596a...08ff";  // senare din signer/wallet
  const contracts = [];            // här stoppar vi in TokenPackSeries

  const data = await getUnifiedActivity(wallet, contracts);
  console.log("Unified activity:", data);

  // TODO: render feed in your UI
}
// Simple global state
const state = {
  wallet: null,
  walletFull: null,
  theme: "dark",
  verified: {
    x: false,
    farcaster: false,
    base: false,
  },
  activeSeries: null, // TokenPackSeries address (frontend only)
};

// Helpers
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));
const shorten = (addr) =>
  addr && addr.length > 10 ? addr.slice(0, 6) + "…" + addr.slice(-4) : addr || "";

// ----- Tabs -----
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

// ----- Ticker -----
function initTicker() {
  const el = $("#ticker-text");
  if (!el) return;

  const messages = [
    "PackForge Hub online • monitoring Base pulls…",
    "Mock series: Neon Draft · Prism Vault · Chaos Forge · Mythgrid",
    "Luckiest pull (mock): Mythic Foil at $0.12 → floor $24.20",
    "Unluckiest run: 0xdead…beef • 0 / 400 legends pulled",
  ];

  el.textContent = messages.join("   •   ");
}

// ----- Demo data -----
// Trading-side demo packs (series-level)
const demoPacks = [
  {
    name: "Neon Draft",
    creator: "spawnizz",
    price: "$0.24",
    supply: "42 cards",
    tags: ["verified", "bounty", "new"],
  },
  {
    name: "Prism Vault",
    creator: "spawnizz",
    price: "$0.28",
    supply: "36 cards",
    tags: ["verified"],
  },
  {
    name: "Chaos Forge",
    creator: "spawnizz",
    price: "$0.46",
    supply: "24 cards",
    tags: ["new"],
  },
  {
    name: "Mythgrid",
    creator: "spawnizz",
    price: "$0.22",
    supply: "18 cards",
    tags: [],
  },
];

// Inventory demo cards — more like real “cards” with full specs
const demoInventory = [
  {
    pack: "Neon Draft",
    cardName: "ND-017 · Prism Jester",
    status: "for-trade",          // for-trade | sealed | grail
    rarity: "Legendary",
    condition: "Mint / Unplayed",
    foil: "Toxic Foil",
    estValue: "$68.00",
    serial: "#17/250",
  },
  {
    pack: "Prism Vault",
    cardName: "PV-001 · Aurora Core",
    status: "sealed",
    rarity: "Mythic",
    condition: "Sealed pack",
    foil: "Base Shine",
    estValue: "$32.00",
    serial: "Pack #1/100",
  },
  {
    pack: "Chaos Forge",
    cardName: "CF-042 · Ember Jack",
    status: "for-trade",
    rarity: "Rare",
    condition: "Lightly played",
    foil: "Non-foil",
    estValue: "$4.20",
    serial: "#42/500",
  },
  {
    pack: "Mythgrid",
    cardName: "MG-007 · Grid Oracle",
    status: "grail",
    rarity: "Legendary",
    condition: "Mint / Grail",
    foil: "Neon Prism Foil",
    estValue: "$120.00",
    serial: "#7/50",
  },
];

const luckiestPulls = [
  { wallet: "0x596a…08ff", pack: "Neon Draft", hit: "Mythic", spent: "$12", value: "$420" },
  { wallet: "0xfeet…sn1ff", pack: "Prism Vault", hit: "Legendary Foil", spent: "$3", value: "$96" },
  { wallet: "0x1337…c0de", pack: "Chaos Forge", hit: "Full set", spent: "$48", value: "$200" },
];

const unluckyPulls = [
  { wallet: "0xdead…beef", pack: "Neon Draft", hit: "0 / 400 legends", spent: "$96", value: "$40" },
  { wallet: "0x0bad…luck", pack: "Prism Vault", hit: "Commons only", spent: "$32", value: "$10" },
];

const statsWallets = [
  { wallet: "0x596a…08ff", score: "9.8", pulls: 420, legends: 16 },
  { wallet: "0xfeet…sn1ff", score: "9.1", pulls: 260, legends: 9 },
  { wallet: "0x1337…c0de", score: "8.7", pulls: 180, legends: 6 },
];

// ----- Rendering helpers -----
function renderTrading() {
  const grid = $("#trading-grid");
  if (!grid) return;

  const activeFilter = $("#trading-filters .filter-chip.active")?.dataset.filter || "all";

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
      if (p.tags.includes("verified")) badges.push('<span class="badge badge-verified">Verified</span>');
      if (p.tags.includes("new")) badges.push('<span class="badge badge-new">New</span>');
      if (p.tags.includes("bounty")) badges.push('<span class="badge badge-bounty">Bounty</span>');

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
            <button class="btn-mini" data-action="open-mock">Open</button>
            <button class="btn-mini" data-action="trade-mock">Trade</button>
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
        <div class="metric-sub">PackForge shell until real prices are fetched.</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">24h pulls (mock)</div>
        <div class="metric-value">3 240 packs</div>
        <div class="metric-sub">When Wield is wired, this becomes onchain stats.</div>
      </div>
    `;
  }
}

function renderInventory() {
  const grid = $("#inventory-grid");
  if (!grid) return;

  const activeFilter = $("#inventory-filters .filter-chip.active")?.dataset.filter || "all";

  const filtered = demoInventory.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "for-trade") return p.status === "for-trade";
    if (activeFilter === "sealed") return p.status === "sealed";
    if (activeFilter === "grail") return p.status === "grail";
    return true;
  });

  grid.innerHTML = filtered
    .map((p) => {
      const statusLabel =
        p.status === "for-trade"
          ? "For Trade"
          : p.status === "sealed"
          ? "Sealed"
          : p.status === "grail"
          ? "Grail"
          : p.status;

      return `
      <article class="pack-card">
        <div class="pack-header">
          <div class="pack-title">${p.cardName}</div>
          <div class="pack-meta">
            <span>${p.estValue}</span>
            <span class="pack-creator">${statusLabel.toUpperCase()}</span>
          </div>
        </div>

        <div class="pack-badges">
          <span class="badge badge-supply">${p.rarity}</span>
          <span class="badge">Series: ${p.pack}</span>
          <span class="badge">${p.condition}</span>
          <span class="badge">${p.foil}</span>
          <span class="badge">${p.serial}</span>
        </div>

        <div class="card-actions">
          <button class="btn-mini">List on market</button>
          <button class="btn-mini">Mark as Grail</button>
          <button class="btn-mini">View history</button>
        </div>
      </article>
    `;
    })
    .join("");

  const metrics = $("#inventory-metrics");
  if (metrics) {
    const total = demoInventory.length;
    const legends = demoInventory.filter((p) => p.rarity.toLowerCase() === "legendary").length;
    const mythics = demoInventory.filter((p) => p.rarity.toLowerCase() === "mythic").length;
    const sealed = demoInventory.filter((p) => p.status === "sealed").length;

    metrics.innerHTML = `
      <div class="metric-card">
        <div class="metric-label">Total items</div>
        <div class="metric-value">${total}</div>
        <div class="metric-sub">Cards and packs tracked in this wallet (mock).</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Legendaries / Mythics</div>
        <div class="metric-value">${legends} L · ${mythics} M</div>
        <div class="metric-sub">Perfect flex number for screenshots.</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Sealed pieces</div>
        <div class="metric-value">${sealed}</div>
        <div class="metric-sub">Potential future pulls.</div>
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
        <div class="metric-label">PackForge XP (mock)</div>
        <div class="metric-value">524.6K XP</div>
        <div class="metric-sub">Your own XP engine, separate from Vibe.</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Daily pulls (mock)</div>
        <div class="metric-value">1 120</div>
        <div class="metric-sub">Becomes live once contracts + indexer are wired.</div>
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
    ok ? '<span class="badge badge-verified">Linked</span>' : '<span class="badge">Not linked</span>';

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
      desc: "Boosterbox / Wield pack–compatible series.",
      id: "pack",
    },
    {
      title: "Reward Token (ERC20)",
      desc: "XP / points / bonus tokens for your collectors.",
      id: "token",
    },
    {
      title: "Lootbox / Airdrop ERC1155",
      desc: "Batches, mystery loot and event drops.",
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
        `Deploy mode "${id}" is a UI mock right now.\n\nOnce the Hardhat scripts are locked in, this connects to /scripts/deploy*.ts`
      );
    });
  });
}

// ----- Luck meter -----
function initLuckMeter() {
  const fill = $("#luck-fill");
  const label = $("#luck-label");
  if (!fill || !label) return;

  function update() {
    const value = Math.floor(30 + Math.random() * 60); // 30–90%
    fill.style.width = value + "%";
    label.textContent = `Luck (mock): ${value}% · will move live once you start opening packs.`;
  }

  update();
  setInterval(update, 3500);
}

// ----- Pack map (canvas) -----
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
      { x: 80, y: 120, r: 26, color: "#3dffb8", label: "ND" },
      { x: 200, y: 80, r: 22, color: "#ff1744", label: "PV" },
      { x: 300, y: 150, r: 18, color: "#ffeb3b", label: "CF" },
      { x: 180, y: 200, r: 20, color: "#7c4dff", label: "MG" },
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
      const gradient = ctx.createRadialGradient(n.x - 4, n.y - 6, 4, n.x, n.y, n.r);
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

// ----- Chat -----
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
    addMessage(state.walletFull ? shorten(state.walletFull) : "you · 0x…", v);
    input.value = "";
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      send.click();
    }
  });

  addMessage("system", "Wallet-to-wallet chat lives here – mocked messages for now.");
}

// ----- Wallet, chain & theme -----
function updateWalletUI() {
  const statusWallet = $("#status-wallet");
  const settingsWallet = $("#settings-wallet");
  if (statusWallet) statusWallet.textContent = state.wallet || "Not connected";
  if (settingsWallet)
    settingsWallet.textContent = state.walletFull
      ? `Connected: ${state.walletFull}`
      : "Not connected.";
}

async function detectChain() {
  const pill = $("#network-pill");
  const chainSpan = $("#status-chain");
  if (!window.ethereum) {
    if (pill) pill.textContent = "No wallet detected";
    if (chainSpan) chainSpan.textContent = "–";
    return;
  }

  try {
    const chainIdHex = await window.ethereum.request({ method: "eth_chainId" });
    const chainId = parseInt(chainIdHex, 16);
    let label = `Chain ${chainId}`;
    if (chainId === 8453) label = "Base Mainnet · live mode";
    if (chainId === 84532) label = "Base Sepolia · test mode";

    if (pill) pill.textContent = label;
    if (chainSpan) chainSpan.textContent = label;
  } catch (e) {
    if (pill) pill.textContent = "Unknown chain";
    if (chainSpan) chainSpan.textContent = "Unknown";
  }
}

function initWalletButtons() {
  const mainBtn = $("#btn-connect");
  const setConnect = $("#btn-settings-connect");
  const setDisconnect = $("#btn-settings-disconnect");

  async function connectReal() {
    if (!window.ethereum) {
      alert("Install a wallet (MetaMask, Base, Rainbow…) or open in a web3 browser.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const addr = accounts[0];
      state.walletFull = addr;
      state.wallet = shorten(addr);
      updateWalletUI();
      const sync = $("#status-sync");
      if (sync) sync.textContent = "synced (wallet)";
      await detectChain();
    } catch (e) {
      console.error(e);
    }
  }

  function disconnect() {
    state.wallet = null;
    state.walletFull = null;
    updateWalletUI();
    const sync = $("#status-sync");
    if (sync) sync.textContent = "waiting…";
  }

  [mainBtn, setConnect].forEach((btn) => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (state.walletFull) {
        alert("Wallet already connected.");
      } else {
        connectReal();
      }
    });
  });

  if (setDisconnect) setDisconnect.addEventListener("click", disconnect);

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", (accounts) => {
      if (!accounts.length) {
        state.wallet = null;
        state.walletFull = null;
      } else {
        state.walletFull = accounts[0];
        state.wallet = shorten(accounts[0]);
      }
      updateWalletUI();
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });
  }
}

function initTheme() {
  const previews = $$(".theme-preview");
  const statusTheme = $("#status-theme");

  previews.forEach((p) => {
    p.addEventListener("click", () => {
      const theme = p.dataset.theme;
      if (theme !== "dark") {
        alert("Only dark theme is active right now (light becomes editor mode later).");
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

// ----- Verified buttons -----
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

// ----- Filters -----
function initFilters() {
  $("#trading-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    $$("#trading-filters .filter-chip").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderTrading();
  });

  $("#inventory-filters")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-chip");
    if (!btn) return;
    $$("#inventory-filters .filter-chip").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderInventory();
  });
}

// ----- Creator Forge buttons -----
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
    alert("Mock: Foil previews generated (Base Shine · Toxic · Neon Prism).");
  });
}

// ----- Active series (frontend) -----
function initActiveSeries() {
  const input = $("#series-address-input");
  const btn = $("#btn-save-series");
  const current = $("#series-address-current");
  const stored = window.localStorage.getItem("packforge_active_series");

  if (stored) {
    state.activeSeries = stored;
    if (current) current.textContent = stored;
  }

  if (!btn || !input) return;

  btn.addEventListener("click", () => {
    const v = input.value.trim();
    if (!v) return alert("Paste a TokenPackSeries address first.");
    state.activeSeries = v;
    window.localStorage.setItem("packforge_active_series", v);
    if (current) current.textContent = v;
    alert("Active series saved (frontend only).");
  });
}

// ----- Init -----
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
  initActiveSeries();
  updateWalletUI();
  detectChain();
});