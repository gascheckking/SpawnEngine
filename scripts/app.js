// Basic global state
const state = {
  walletAddress: null,
  packsAll: [],
  packsVerified: [],
  packsNew: [],
  recentPulls: [],
  verifiedCreators: [],
  apiHealthy: false,
};

// ---------- UTIL ----------

function shortAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

function formatUsd(num) {
  if (num == null || isNaN(num)) return "-";
  const n = Number(num);
  if (!isFinite(n)) return "-";
  if (n >= 1000) return "$" + n.toFixed(0);
  if (n >= 10) return "$" + n.toFixed(2);
  return "$" + n.toFixed(3);
}

// call our proxy: /api/wield/*
async function wieldFetch(path, params = {}) {
  const query = new URLSearchParams(params);
  const url = `/api/wield/${path}${query.toString() ? `?${query}` : ""}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Wield error: ${res.status}`);
  }
  const json = await res.json();
  state.apiHealthy = true;
  updateApiStatus();
  updateSyncStatus();
  return json;
}

// ---------- DOM INIT ----------

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initWalletButtons();
  restoreWalletFromStorage();
  bootstrapData();
});

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const views = document.querySelectorAll(".view");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-tab");

      tabButtons.forEach((b) => b.classList.remove("active"));
      views.forEach((v) => v.classList.remove("active"));

      btn.classList.add("active");
      const view = document.getElementById(`view-${target}`);
      if (view) view.classList.add("active");
    });
  });

  const filters = document.querySelectorAll(".filter-chip");
  filters.forEach((chip) => {
    chip.addEventListener("click", () => {
      filters.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const filter = chip.getAttribute("data-packfilter");
      renderTradingCards(filter);
    });
  });
}

function initWalletButtons() {
  const headerBtn = document.getElementById("walletButton");
  const settingsConnect = document.getElementById("settingsConnect");
  const settingsDisconnect = document.getElementById("settingsDisconnect");

  headerBtn.addEventListener("click", connectWallet);
  settingsConnect.addEventListener("click", connectWallet);
  settingsDisconnect.addEventListener("click", disconnectWallet);
}

// ---------- WALLET ----------

async function connectWallet() {
  try {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const addr = accounts[0];
      setWalletAddress(addr);
    } else {
      const fake = prompt(
        "No injected wallet found. Enter a wallet address to simulate connection (Base)."
      );
      if (fake) setWalletAddress(fake.trim());
    }
  } catch (err) {
    console.error("Wallet connect error", err);
  }
}

function disconnectWallet() {
  state.walletAddress = null;
  localStorage.removeItem("spawnEngineWallet");
  updateWalletUi();
  renderForTrade(); // clear
  updateSyncStatus();
}

function setWalletAddress(addr) {
  state.walletAddress = addr;
  localStorage.setItem("spawnEngineWallet", addr);
  updateWalletUi();
  renderForTrade();
  updateSyncStatus();
}

function restoreWalletFromStorage() {
  const saved = localStorage.getItem("spawnEngineWallet");
  if (saved) {
    state.walletAddress = saved;
    updateWalletUi();
    renderForTrade();
    updateSyncStatus();
  }
}

function updateWalletUi() {
  const headerBtn = document.getElementById("walletButton");
  const settingsStatus = document.getElementById("settingsWalletStatus");
  const statusWallet = document.getElementById("status-wallet");

  if (!headerBtn || !settingsStatus || !statusWallet) return;

  if (state.walletAddress) {
    const short = shortAddress(state.walletAddress);
    headerBtn.textContent = short;
    settingsStatus.textContent = `Connected: ${state.walletAddress}`;
    statusWallet.textContent = `Wallet: ${short}`;
  } else {
    headerBtn.textContent = "Connect Wallet";
    settingsStatus.textContent = "Not connected.";
    statusWallet.textContent = "Wallet: Not connected";
  }
}

// ---------- STATUS ----------

function updateApiStatus() {
  const el = document.getElementById("status-api");
  const settingsApi = document.getElementById("settingsApiStatus");
  if (!el || !settingsApi) return;

  if (state.apiHealthy) {
    el.textContent = "Wield API: Connected via proxy";
    settingsApi.textContent = "Status: OK – /api/wield/* proxy svarar.";
  } else {
    el.textContent = "Wield API: Unknown";
    settingsApi.textContent =
      "Status: ännu inget svar (test körs vid första request).";
  }
}

function updateSyncStatus() {
  const el = document.getElementById("status-sync");
  if (!el) return;
  if (state.walletAddress && state.apiHealthy) {
    el.textContent = "Sync: Wallet + Wield live";
  } else if (state.apiHealthy) {
    el.textContent = "Sync: API OK · Connect wallet for full view";
  } else {
    el.textContent = "Sync: waiting…";
  }
}

// ---------- DATA BOOTSTRAP ----------

async function bootstrapData() {
  updateApiStatus();
  updateSyncStatus();
  await Promise.allSettled([
    loadAllPacks(),
    loadVerifiedPacks(),
    loadRecentPulls(),
  ]);
  buildDerivedData();
  renderAll();
  startTickerLoop();
  startActivityRefreshLoop();
}

async function loadAllPacks() {
  try {
    const data = await wieldFetch("market/cardpacks", { limit: 36 });
    const packs = data?.items || data || [];
    state.packsAll = packs;
  } catch (e) {
    console.error("loadAllPacks", e);
  }
}

async function loadVerifiedPacks() {
  try {
    const data = await wieldFetch("market/cardpacks", {
      limit: 36,
      verified: "true",
    });
    const packs = data?.items || data || [];
    state.packsVerified = packs;
  } catch (e) {
    console.error("loadVerifiedPacks", e);
  }
}

async function loadRecentPulls() {
  try {
    const data = await wieldFetch("vibe/boosterbox/recent", { limit: 30 });
    const pulls = data?.items || data || [];
    state.recentPulls = pulls;
  } catch (e) {
    console.error("loadRecentPulls", e);
  }
}

function buildDerivedData() {
  state.packsNew = state.packsAll.slice(0, 12);

  const creatorMap = new Map();
  const source = state.packsVerified || [];
  source.forEach((pack) => {
    const creator = pack.creator || pack.creatorAddress || pack.owner;
    if (!creator) return;
    const key = creator.toLowerCase();
    if (!creatorMap.has(key)) {
      creatorMap.set(key, {
        creator,
        packs: 0,
        totalVolumeUsd: 0,
        anyName: pack.collectionName || pack.name || "Pack",
      });
    }
    const entry = creatorMap.get(key);
    entry.packs += 1;

    const price =
      pack.priceUsd ??
      pack.price_usd ??
      pack.price ??
      pack.floorUsd ??
      pack.floorPriceUsd ??
      0;
    if (!isNaN(price)) entry.totalVolumeUsd += Number(price);
  });

  state.verifiedCreators = Array.from(creatorMap.values()).sort(
    (a, b) => b.totalVolumeUsd - a.totalVolumeUsd
  );
}

// ---------- RENDER ----------

function renderAll() {
  renderTradingCards("all");
  renderForTrade();
  renderOverview();
  renderActivity();
  renderCreators();
  renderTicker();
}

function renderTradingCards(filter) {
  const container = document.getElementById("tradingCards");
  if (!container) return;

  let packs = state.packsAll;
  if (filter === "new") packs = state.packsNew;
  if (filter === "verified") packs = state.packsVerified;

  if (!packs || packs.length === 0) {
    container.innerHTML =
      '<p class="muted">No packs found yet – check your Wield API key & proxy.</p>';
    return;
  }

  container.innerHTML = packs
    .map((pack) => {
      const name = pack.name || pack.title || "Unnamed Pack";
      const collection = pack.collectionName || pack.series || "";
      const creator =
        pack.creatorName ||
        pack.creator ||
        pack.creatorAddress ||
        pack.owner ||
        "Unknown";
      const supplyTotal = pack.totalSupply || pack.maxSupply || pack.supply || "?";
      const supplyLeft = pack.remainingSupply ?? pack.remaining ?? null;
      const isVerified = !!(pack.verified || pack.isVerified);

      const price =
        pack.priceUsd ??
        pack.price_usd ??
        pack.price ??
        pack.floorUsd ??
        pack.floorPriceUsd ??
        null;

      const bounty =
        pack.bigBountyLabel ||
        pack.bountyLabel ||
        (pack.hasBounty ? "Bounty live" : null);

      return `
      <article class="pack-card">
        <div class="pack-header">
          <div class="pack-title">
            <div>${name}</div>
            ${
              collection
                ? `<div class="pack-creator">${collection}</div>`
                : ""
            }
          </div>
          <div class="pack-meta">
            <span class="pack-price">${formatUsd(price)}</span>
            <span class="pack-creator">${shortAddress(creator)}</span>
          </div>
        </div>
        <div class="pack-badges">
          ${
            isVerified
              ? `<span class="badge badge-verified">Verified</span>`
              : ""
          }
          <span class="badge badge-supply">
            Supply: ${supplyLeft ?? "?"}/${supplyTotal}
          </span>
          ${
            filter === "new"
              ? `<span class="badge badge-new">New</span>`
              : ""
          }
          ${bounty ? `<span class="badge badge-bounty">${bounty}</span>` : ""}
        </div>
        <div class="card-actions">
          <button class="btn-mini" data-pack-id="${pack.id || pack.packId || ""}">
            Open / View
          </button>
          <button class="btn-mini">
            Fast Buy
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}

function renderForTrade() {
  const container = document.getElementById("forTradeList");
  if (!container) return;

  if (!state.walletAddress) {
    container.innerHTML =
      '<p class="muted">Connect wallet to load packs owned by this address.</p>';
    return;
  }

  const pulls = state.recentPulls || [];
  if (pulls.length === 0) {
    container.innerHTML =
      '<p class="muted">No pulls loaded yet – open some packs or wait for activity.</p>';
    return;
  }

  container.innerHTML = pulls
    .slice(0, 18)
    .map((pull) => {
      const packName = pull.packName || pull.series || "Pack";
      const cardName = pull.cardName || pull.name || "Card";
      const rarity = pull.rarity || pull.tier || "Unknown";
      const value = pull.valueUsd ?? pull.priceUsd ?? pull.price ?? null;
      return `
        <article class="pack-card">
          <div class="pack-header">
            <div class="pack-title">
              <div>${cardName}</div>
              <div class="pack-creator">${packName}</div>
            </div>
            <div class="pack-meta">
              <span class="pack-price">${formatUsd(value)}</span>
              <span class="pack-creator">${rarity}</span>
            </div>
          </div>
          <div class="card-actions">
            <button class="btn-mini">List / Trade</button>
            <button class="btn-mini">Mark For Swap</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderOverview() {
  const container = document.getElementById("overviewMetrics");
  if (!container) return;

  const all = state.packsAll || [];
  const verified = state.packsVerified || [];
  const pulls = state.recentPulls || [];

  const totalPacks = all.length;
  const verifiedCount = verified.length;
  const totalRecentVolume = pulls.reduce((acc, p) => {
    const v = p.valueUsd ?? p.priceUsd ?? p.price ?? 0;
    return isNaN(v) ? acc : acc + Number(v);
  }, 0);

  container.innerHTML = `
    <div class="metric-card">
      <div class="metric-label">Total packs (visible)</div>
      <div class="metric-value">${totalPacks}</div>
      <div class="metric-sub">Fetched via Wield /market/cardpacks</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Verified series</div>
      <div class="metric-value">${verifiedCount}</div>
      <div class="metric-sub">Auto-detected verified collections</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Recent pull volume</div>
      <div class="metric-value">${formatUsd(totalRecentVolume)}</div>
      <div class="metric-sub">Based on last ${pulls.length} pulls</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Creator earnings mode</div>
      <div class="metric-value">10–50% to creators</div>
      <div class="metric-sub">Configured in SpawnEngine contracts</div>
    </div>
  `;
}

function renderActivity() {
  const container = document.getElementById("activityFeed");
  if (!container) return;

  const pulls = state.recentPulls || [];
  if (pulls.length === 0) {
    container.innerHTML =
      '<p class="muted">No pulls yet – waiting for activity from Wield.</p>';
    return;
  }

  container.innerHTML = pulls
    .slice(0, 25)
    .map((pull) => {
      const wallet = pull.buyer || pull.wallet || pull.owner || "0x…";
      const packName = pull.packName || pull.series || "Pack";
      const cardName = pull.cardName || pull.name || "Card";
      const rarity = pull.rarity || pull.tier || "Unknown rarity";
      const value = pull.valueUsd ?? pull.priceUsd ?? pull.price ?? null;

      return `
        <div class="activity-item">
          <div class="activity-main">
            <div class="activity-wallet">${shortAddress(wallet)} pulled</div>
            <div class="activity-pack">${cardName} · ${packName}</div>
          </div>
          <div class="activity-meta">
            <div>${rarity}</div>
            <div>${formatUsd(value)}</div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCreators() {
  const container = document.getElementById("creatorList");
  if (!container) return;

  const creators = state.verifiedCreators || [];
  if (creators.length === 0) {
    container.innerHTML =
      '<p class="muted">No verified creators detected yet. Check /market/cardpacks?verified=true.</p>';
    return;
  }

  container.innerHTML = creators
    .map((c) => {
      return `
      <article class="creator-card">
        <div class="creator-name">${c.anyName}</div>
        <div class="creator-addr">${shortAddress(c.creator)}</div>
        <div class="creator-stats">
          <span>Packs: ${c.packs}</span>
          <span>Approx volume: ${formatUsd(c.totalVolumeUsd)}</span>
        </div>
      </article>
    `;
    })
    .join("");
}

// ---------- TICKER ----------

function renderTicker() {
  const el = document.getElementById("tickerContent");
  if (!el) return;

  const pulls = state.recentPulls || [];
  if (pulls.length === 0) {
    el.textContent = "Waiting for pulls from Wield /vibe/boosterbox/recent…";
    return;
  }

  const items = pulls.slice(0, 30).map((pull) => {
    const wallet = shortAddress(
      pull.buyer || pull.wallet || pull.owner || "0x…"
    );
    const packName = pull.packName || pull.series || "Pack";
    const cardName = pull.cardName || pull.name || "Card";
    const rarity = pull.rarity || pull.tier || "Unknown";
    const value = pull.valueUsd ?? pull.priceUsd ?? pull.price ?? null;

    return `${wallet} just pulled ${rarity} ${cardName} from ${packName} – ${formatUsd(
      value
    )}`;
  });

  const full = items.concat(items).join("  •  ");
  el.textContent = full;
}

function startTickerLoop() {
  setInterval(async () => {
    await loadRecentPulls();
    buildDerivedData();
    renderActivity();
    renderForTrade();
    renderTicker();
    updateSyncStatus();
  }, 30000);
}

function startActivityRefreshLoop() {
  setInterval(async () => {
    await loadAllPacks();
    await loadVerifiedPacks();
    buildDerivedData();
    const activeFilter =
      document
        .querySelector(".filter-chip.active")
        ?.getAttribute("data-packfilter") || "all";
    renderTradingCards(activeFilter);
    renderOverview();
    renderCreators();
    updateSyncStatus();
  }, 60000);
}