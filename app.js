// SPAWNENGINE — APP.JS
// Compact Farcaster-style mini-app logic

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initSections();
  initTicker();
  initWallet();
  initChat();
  renderAllViews();
});

/* ---------------------------- */
/*           TABS               */
/* ---------------------------- */
function initTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const screens = document.querySelectorAll(".view");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.screen;

      buttons.forEach((b) => b.classList.remove("active"));
      screens.forEach((s) => s.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(target).classList.add("active");
    });
  });
}

/* ---------------------------- */
/*        COLLAPSIBLE SECTIONS  */
/* ---------------------------- */
function initSections() {
  const sections = document.querySelectorAll(".section");

  sections.forEach((sec) => {
    const header = sec.querySelector(".section-header");
    if (!header) return;

    header.addEventListener("click", () => {
      sec.classList.toggle("open");
    });
  });
}

/* ---------------------------- */
/*         WALLET MOCK          */
/* ---------------------------- */
let walletConnected = false;

function initWallet() {
  const btn = document.getElementById("btn-connect");

  if (!btn) return;

  btn.addEventListener("click", () => {
    walletConnected = !walletConnected;

    btn.textContent = walletConnected ? "Connected" : "Connect Wallet";

    const chip = document.getElementById("chip-wallet");
    if (chip) chip.textContent = walletConnected ? "Wallet: Connected" : "Wallet: Disconnected";
  });
}

/* ---------------------------- */
/*           CHAT              */
/* ---------------------------- */
function initChat() {
  const input = document.getElementById("chat-input");
  const btn = document.getElementById("chat-send");
  const box = document.getElementById("chat-messages");

  if (!input || !btn || !box) return;

  btn.addEventListener("click", () => sendChat(input, box));
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendChat(input, box);
  });
}

function sendChat(input, box) {
  const text = input.value.trim();
  if (!text) return;

  const bubble = document.createElement("div");
  bubble.style.padding = "6px 8px";
  bubble.style.background = "rgba(255,255,255,0.06)";
  bubble.style.borderRadius = "12px";
  bubble.style.fontSize = "0.8rem";
  bubble.textContent = text;

  box.appendChild(bubble);
  box.scrollTop = box.scrollHeight;
  input.value = "";
}

/* ---------------------------- */
/*           TICKER             */
/* ---------------------------- */
function initTicker() {
  const track = document.querySelector(".ticker-content");
  if (!track) return;

  track.innerHTML =
    "Pack opened · Rare pull · Creator opened new series · Mythic hit · Zora buy · Swap · Burn · Pack opened · ";
}

/* ---------------------------- */
/*          MOCK DATA           */
/* ---------------------------- */
const FEED = [
  { type: "pack_open", user: "0xA93...", series: "Neon Fragments", rarity: "Rare", ts: "10s ago" },
  { type: "burn", user: "0x4B1...", series: "Void Keys", rarity: "Common", ts: "25s ago" },
  { type: "swap", user: "0xD29...", series: "Shard Forge", rarity: "Legendary", ts: "1m ago" },
  { type: "zora_buy", user: "0x91F...", series: "Base Relics", rarity: "Epic", ts: "2m ago" },
];

const INVENTORY = [
  { name: "Neon Fragment", coll: "Neon Fragments", rarity: "rare", status: "opened" },
  { name: "Void Shard", coll: "Shard Forge", rarity: "epic", status: "opened" },
  { name: "Prime Relic", coll: "Relic Vault", rarity: "legendary", status: "unopened" },
  { name: "Spawn Core", coll: "Spawn Core", rarity: "mythic", status: "opened" },
];

/* ---------------------------- */
/*     MAIN RENDER FUNCTIONS    */
/* ---------------------------- */
function renderAllViews() {
  renderFeed();
  renderInventory();
  renderTrading();
  renderLuck();
}

/* ---------------------------- */
/*          FEED VIEW           */
/* ---------------------------- */
function renderFeed() {
  const root = document.getElementById("feed-list");
  if (!root) return;

  root.innerHTML = "";

  FEED.forEach((e) => {
    const item = document.createElement("div");
    item.className = "feed-item";

    item.innerHTML = `
      <div class="feed-main">
        <div class="feed-type">${e.type}</div>
        <div class="feed-text">${e.user} → ${e.series} (${e.rarity})</div>
      </div>
      <div class="feed-meta">${e.ts}</div>
    `;

    root.appendChild(item);
  });
}

/* ---------------------------- */
/*        INVENTORY VIEW        */
/* ---------------------------- */
function renderInventory() {
  const root = document.getElementById("inventory-list");
  if (!root) return;

  root.innerHTML = "";

  INVENTORY.forEach((c) => {
    const wrap = document.createElement("div");
    wrap.className = "inventory-card";

    wrap.innerHTML = `
      <div class="inv-thumb-shell">
        <div class="inv-thumb-faux"></div>
      </div>

      <div class="inv-info">
        <div class="inv-title">${c.name}</div>
        <div class="inv-collection">${c.coll}</div>

        <div class="inv-tags">
          <div class="inv-badge rarity-${c.rarity}">${c.rarity}</div>
          <div class="inv-badge status-${c.status}">${c.status}</div>
        </div>
      </div>
    `;

    root.appendChild(wrap);
  });
}

/* ---------------------------- */
/*        TRADING VIEW          */
/* ---------------------------- */
function renderTrading() {
  const root = document.getElementById("trading-metrics");
  if (!root) return;

  root.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Total Volume</div>
      <div class="metric-value">143.2 ETH</div>
      <div class="metric-sub">+12.3% today</div>
    </div>

    <div class="metric-card">
      <div class="metric-label">Active Packs</div>
      <div class="metric-value">32</div>
      <div class="metric-sub">Live collections</div>
    </div>

    <div class="metric-card">
      <div class="metric-label">Unique Traders</div>
      <div class="metric-value">4,912</div>
      <div class="metric-sub">This week</div>
    </div>
  `;
}

/* ---------------------------- */
/*       LUCK METER VIEW        */
/* ---------------------------- */
function renderLuck() {
  const fill = document.getElementById("luck-fill");
  if (!fill) return;

  const value = Math.floor(Math.random() * 100);
  fill.style.width = value + "%";
}