// Simple global state
const state = {
  wallet: null,
  walletFull: null,
  theme: "dark",
  stats: {
    xp: 524600,
    revenueUsd: 1240.5,
    packsOpened: 342,
    packsCreated: 8,
  },
  contracts: {
    factory: "not set",
    guard: "not set",
    utility: "not set",
  },
};

// Demo data
const demoActivity = [
  {
    type: "PACK_OPEN",
    text: "0x596a…08ff opened Tiny Legends 2 → Mythic foil hit",
    time: "12s ago",
  },
  {
    type: "FARCASTER",
    text: "@spawniz casted: “Mesh all packs into one stream”",
    time: "45s ago",
  },
  {
    type: "ZORA",
    text: "Minted 3x Foil Realms index tokens on Zora",
    time: "2m ago",
  },
  {
    type: "BURN",
    text: "0xfeet…sn1ff burned 5 commons → won 2 packs",
    time: "3m ago",
  },
  {
    type: "SWAP",
    text: "0x1337…c0de swapped 1 Mad Myth legend → 120 USDC",
    time: "5m ago",
  },
];

const demoInventory = [
  {
    id: "tl2-pack-1",
    kind: "pack",
    name: "Tiny Legends 2 Pack",
    collection: "Tiny Legends 2",
    rarity: "legendary",
    status: "unopened",
    value: "$4.20",
    mint: "#482",
    burnable: true,
    grail: false,
  },
  {
    id: "foil-realms-1",
    kind: "pack",
    name: "Foil Realms Booster",
    collection: "Foil Realms",
    rarity: "mythic",
    status: "unopened",
    value: "$32.00",
    mint: "#19",
    burnable: false,
    grail: true,
  },
  {
    id: "card-1",
    kind: "card",
    name: "Mad Myth · Chaos Avatar",
    collection: "Mad Myth",
    rarity: "rare",
    status: "opened",
    value: "$6.80",
    mint: "#77",
    burnable: true,
    grail: false,
  },
  {
    id: "card-2",
    kind: "card",
    name: "Aura Maxxed · Neon Shell",
    collection: "Aura Maxxed",
    rarity: "epic",
    status: "opened",
    value: "$14.00",
    mint: "#11",
    burnable: false,
    grail: true,
  },
];

const demoSeries = [
  {
    name: "Tiny Legends 2 · TokenPackSeries",
    addr: "0xTL2…PACK",
    chain: "Base Sepolia",
  },
  {
    name: "Foil Realms · TokenPackSeries",
    addr: "0xFOIL…PACK",
    chain: "Base",
  },
];

const demoCreateTypes = [
  {
    id: "token-pack",
    title: "Token Pack (ERC20)",
    desc: "Classic EV packs with ERC20 payout token and ReserveGuard.",
  },
  {
    id: "nft-pack",
    title: "NFT Pack (ERC721/1155)",
    desc: "Card-based packs for art collections and trading series.",
  },
  {
    id: "zora-pack",
    title: "Zora Coin Pack",
    desc: "Bundles of creator coins and Zora-based rewards.",
  },
  {
    id: "hybrid-pack",
    title: "Hybrid / Social Pack",
    desc: "XP, quests and social boosts combined with onchain rewards.",
  },
];

// Helpers
const $ = (q) => document.querySelector(q);
const $$ = (q) => Array.from(document.querySelectorAll(q));

// Nav
function initNav() {
  const buttons = $$(".nav-btn");
  const screens = $$(".screen");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.screen;
      buttons.forEach((b) => b.classList.remove("active"));
      screens.forEach((s) => s.classList.remove("active"));

      btn.classList.add("active");
      const el = document.getElementById(target);
      if (el) el.classList.add("active");
    });
  });
}

// Collapsibles
function initCollapsibles() {
  $$(".section-header").forEach((hdr) => {
    hdr.addEventListener("click", () => {
      const id = hdr.dataset.toggle;
      const content = document.getElementById(id);
      const section = hdr.closest(".section");
      if (!content || !section) return;

      const isOpen = content.classList.contains("open");
      content.classList.toggle("open", !isOpen);
      section.classList.toggle("open", !isOpen);
    });
  });
}

// Ticker
function initTicker() {
  const el = $("#ticker-text");
  if (!el) return;

  const msgs = [
    "SpawnEngine Mesh online — merging pack pulls, swaps and burns into one stream.",
    "Live mythic hit → Tiny Legends 2 → EV spike.",
    "Farcaster casts and Zora mints soon wired directly into this ticker.",
    "ReserveGuard watching: 2x mythic coverage + buffer per series.",
  ];
  el.textContent = msgs.join("   •   ");
}

// Wallet
function updateWalletUI() {
  const short = state.wallet || "Not connected";
  const full = state.walletFull || "";
  $("#status-wallet").textContent = short;
  $("#status-sync").textContent = state.wallet ? "synced (mock)" : "idle";
  $("#settings-wallet") && ($("#settings-wallet").textContent = full || short);
}

function initWalletButtons() {
  const mainBtn = $("#btn-connect");

  function mockConnect() {
    state.walletFull = "0x596aA9F10b8459aF0C78cF990eF3089908fF08ff";
    state.wallet = "0x596a…08ff";
    updateWalletUI();
    renderProfileSummary();
    renderInventory();
    renderLiveFeed();
  }

  if (mainBtn) {
    mainBtn.addEventListener("click", () => {
      if (state.wallet) {
        alert("Wallet already mocked as connected.");
      } else {
        mockConnect();
      }
    });
  }
}

// Profile summary
function renderProfileSummary() {
  const box = $("#profile-summary-metrics");
  if (!box) return;

  const { xp, revenueUsd, packsOpened, packsCreated } = state.stats;

  box.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Mesh XP (mock)</div>
      <div class="metric-value">${xp.toLocaleString("en-US")} XP</div>
      <div class="metric-sub">From pulls, burns, swaps and social boosts.</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Total revenue (mock)</div>
      <div class="metric-value">$${revenueUsd.toFixed(2)}</div>
      <div class="metric-sub">Creator share across all your series.</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Packs opened</div>
      <div class="metric-value">${packsOpened}</div>
      <div class="metric-sub">TokenPackSeries-style EV distribution.</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Series created</div>
      <div class="metric-value">${packsCreated}</div>
      <div class="metric-sub">More series = more mesh data.</div>
    </div>
  `;
}

// Social identity
function renderProfileSocial() {
  const grid = $("#profile-social-grid");
  if (!grid) return;

  grid.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Farcaster</div>
      <div class="metric-value">@spawniz (mock)</div>
      <div class="metric-sub">Future: sync casts, reactions and miniapp actions.</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Zora</div>
      <div class="metric-value">/spawniz</div>
      <div class="metric-sub">Index of drops, coins and pack-linked rewards.</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">The Base App</div>
      <div class="metric-value">Onchain history</div>
      <div class="metric-sub">Using your Base activity as a trust layer.</div>
    </div>
  `;
}

// Live unified feed
function renderLiveFeed() {
  const feed = $("#live-feed");
  if (!feed) return;

  const items = demoActivity;
  feed.innerHTML = items
    .map(
      (a) => `
      <div class="feed-item">
        <div class="feed-main">
          <span class="feed-type">${a.type}</span>
          <span class="feed-text">${a.text}</span>
        </div>
        <div class="feed-meta">${a.time}</div>
      </div>
    `
    )
    .join("");
}

// Inventory
function renderInventory() {
  const list = $("#inventory-list");
  if (!list) return;

  const active =
    $("#inventory-filters .filter-chip.active")?.dataset.filter || "all";

  const filtered = demoInventory.filter((item) => {
    if (active === "all") return true;
    if (active === "packs") return item.kind === "pack";
    if (active === "cards") return item.kind === "card";
    if (active === "burnable") return item.burnable;
    if (active === "grails") return item.grail;
    return true;
  });

  list.innerHTML = filtered
    .map((p) => {
      const rarityClass = `rarity-${p.rarity}`;
      const statusClass =
        p.status === "unopened" ? "status-unopened" : "status-opened";
      const burnTag = p.burnable
        ? `<span class="inv-badge inv-badge-burnable">Burnable</span>`
        : "";
      const grailTag = p.grail
        ? `<span class="inv-badge inv-badge-grail">Grail</span>`
        : "";

      return `
        <article class="inventory-card">
          <div class="inv-thumb-shell">
            <div class="inv-thumb-faux"></div>
          </div>
          <div class="inv-info">
            <div class="inv-title">${p.name}</div>
            <div class="inv-collection">${p.collection}</div>
            <div class="inv-tags">
              <span class="inv-badge ${rarityClass}">${p.rarity}</span>
              <span class="inv-badge ${statusClass}">${p.status}</span>
              ${burnTag}
              ${grailTag}
            </div>
            <div class="inv-meta">
              <span>${p.mint}</span> • <span>${p.value}</span>
            </div>
            <div class="inv-actions">
              <button class="btn-mini">View</button>
              <button class="btn-mini">Mark for Trade</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  const total = demoInventory.length;
  const packs = demoInventory.filter((i) => i.kind === "pack").length;
  const cards = demoInventory.filter((i) => i.kind === "card").length;
  const grails = demoInventory.filter((i) => i.grail).length;

  // Optional: summary under list
  if (!$("#inventory-summary")) {
    const summary = document.createElement("p");
    summary.id = "inventory-summary";
    summary.className = "metric-sub muted";
    list.parentElement.appendChild(summary);
  }
  $("#inventory-summary").textContent = `Total items: ${total} · Packs: ${packs} · Cards: ${cards} · Grails: ${grails}`;
}

// Filters
function initInventoryFilters() {
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

// Create Packs cards
function renderCreatePacks() {
  const grid = $("#create-pack-grid");
  if (!grid) return;

  grid.innerHTML = demoCreateTypes
    .map(
      (c) => `
      <article class="pack-card">
        <div class="pack-header">
          <div class="pack-title">${c.title}</div>
        </div>
        <p class="metric-sub">${c.desc}</p>
        <div class="card-actions">
          <button class="btn-mini" data-create="${c.id}">Configure</button>
        </div>
      </article>
    `
    )
    .join("");

  grid.querySelectorAll("[data-create]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.create;
      alert(
        `Pack type "${id}" is UI-only right now.\n\nLater this will prefill params for your PackFactory + TokenPackSeries deploy.`
      );
    });
  });
}

// Contracts screen
function renderContracts() {
  const f = $("#addr-factory");
  const g = $("#addr-guard");
  const u = $("#addr-utility");
  if (f) f.textContent = state.contracts.factory;
  if (g) g.textContent = state.contracts.guard;
  if (u) u.textContent = state.contracts.utility;

  const list = $("#series-list");
  if (!list) return;

  list.innerHTML = demoSeries
    .map(
      (s) => `
      <div class="activity-item">
        <div class="activity-main">
          <div class="activity-wallet">${s.name}</div>
          <div class="activity-pack mono">${s.addr}</div>
        </div>
        <div class="activity-meta">${s.chain}</div>
      </div>
    `
    )
    .join("");
}

// Theme (dark only)
function initTheme() {
  $("#status-theme").textContent = "Dark";
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initCollapsibles();
  initTicker();
  initWalletButtons();
  initInventoryFilters();
  initTheme();

  renderProfileSummary();
  renderProfileSocial();
  renderLiveFeed();
  renderInventory();
  renderCreatePacks();
  renderContracts();
  updateWalletUI();
});