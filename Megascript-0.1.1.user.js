// ==UserScript==
// @name         MegaScript
// @namespace    local.feishu.people.megascript
// @version      1.0.4
// @description  EnhanceProfile + PokéLark + LeaderChain merged, with dark/light/system theme toggle.
// @match        https://people.bytedance.net/people/profile*
// @grant        none
// @noframes
// @author       Julian D'Urso
// ==/UserScript==

(function () {
  "use strict";
  if (window.top !== window.self) return;

  // ============================================================
  // Anonymous daily ping (DAU counter via jsDelivr stats)
  // ============================================================
  const SCRIPT_VERSION = "1.0.2";
  const PING_URL = "https://cdn.jsdelivr.net/gh/PhantomOrion1/Megascript@main/ping.txt";
  const PING_STORAGE_KEY = "megascript_pinged_v1";

  function maybePing() {
    if (localStorage.getItem(PING_STORAGE_KEY)) return;
    localStorage.setItem(PING_STORAGE_KEY, "1");
    fetch(`${PING_URL}?v=${SCRIPT_VERSION}`, {
      mode: "no-cors",
      cache: "no-store"
    }).catch(() => {});
  }

  // ============================================================
  // Theme manager (dark / light / system)
  // ============================================================
  const THEME_STORAGE_KEY = "combo_hold_theme_v1";
  const THEME_ATTR = "data-combo-theme";
  const TOGGLE_ID = "combo-hold-theme-toggle";
  const DARK_STYLE_ID = "combo-hold-dark-style";

  function getStoredTheme() {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return v === "dark" || v === "light" || v === "system" ? v : "system";
  }

  function setStoredTheme(theme) {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  function systemPrefersDark() {
    return Boolean(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function resolveTheme(theme) {
    if (theme === "system") return systemPrefersDark() ? "dark" : "light";
    return theme;
  }

  function applyTheme() {
    const resolved = resolveTheme(getStoredTheme());
    if (document.documentElement.getAttribute(THEME_ATTR) !== resolved) {
      document.documentElement.setAttribute(THEME_ATTR, resolved);
    }
    const darkStyle = document.getElementById(DARK_STYLE_ID);
    const wantDisabled = resolved !== "dark";
    if (darkStyle && darkStyle.disabled !== wantDisabled) {
      darkStyle.disabled = wantDisabled;
    }
    updateToggleLabel();
  }

  function nextTheme(current) {
    if (current === "system") return "dark";
    if (current === "dark") return "light";
    return "system";
  }

  function themeLabel(theme) {
    if (theme === "system") return `Theme: Auto (${resolveTheme(theme) === "dark" ? "Dark" : "Light"})`;
    if (theme === "dark") return "Theme: Dark";
    return "Theme: Light";
  }

  function updateToggleLabel() {
    const btn = document.getElementById(TOGGLE_ID);
    if (btn) btn.textContent = themeLabel(getStoredTheme());
  }

  function createThemeToggle() {
    if (document.getElementById(TOGGLE_ID)) return;
    const btn = document.createElement("button");
    btn.id = TOGGLE_ID;
    btn.type = "button";
    btn.title = "Click to cycle theme: System → Dark → Light";
    btn.textContent = themeLabel(getStoredTheme());
    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      setStoredTheme(nextTheme(getStoredTheme()));
      applyTheme();
    });
    document.documentElement.appendChild(btn);
  }

  function ensureThemeToggle() {
    if (!document.getElementById(TOGGLE_ID)) createThemeToggle();
  }

  function addThemeStyles() {
    if (document.getElementById("combo-hold-theme-style")) return;
    const style = document.createElement("style");
    style.id = "combo-hold-theme-style";
    style.textContent = `
      #${TOGGLE_ID} {
        position: fixed;
        top: 64px;
        left: 18px;
        z-index: 999999;
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid rgba(127, 127, 127, 0.35);
        background: rgba(20, 24, 33, 0.78);
        color: #f4f6fb;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      }
      #${TOGGLE_ID}:hover { background: rgba(45, 52, 69, 0.92); }
    `;
    document.head.appendChild(style);
  }

  // ============================================================
  // EnhanceProfile — layout (always) + dark colors (toggleable)
  // ============================================================
  const AVATAR_SIZE = 220;
  const MAX_TILT = 18;
  const ENHANCE_LAYOUT_STYLE_ID = "feishu-profile-avatar-layout-style";
  const INIT_ATTR = "data-feishu-avatar-enhanced";
  const FRAME_CLASS = "feishu-avatar-tilt-frame";

  function addEnhanceLayoutStyles() {
    if (document.getElementById(ENHANCE_LAYOUT_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = ENHANCE_LAYOUT_STYLE_ID;
    style.textContent = `
      [class*="profile-web_header-wrapper"],
      [class*="profile-web_header-container"] {
        position: relative !important;
      }
      [class*="profile-web_header-container"] {
        display: flex !important;
        flex-direction: row !important;
        align-items: center !important;
        min-height: ${AVATAR_SIZE + 40}px !important;
        overflow: visible !important;
      }
      .profile-web_profile-avatar--GvbS1,
      [class*="profile-web_profile-avatar--"] {
        order: 0 !important;
        width: ${AVATAR_SIZE}px !important;
        height: ${AVATAR_SIZE}px !important;
        min-width: ${AVATAR_SIZE}px !important;
        min-height: ${AVATAR_SIZE}px !important;
        max-width: ${AVATAR_SIZE}px !important;
        max-height: ${AVATAR_SIZE}px !important;
        border-radius: 22px !important;
        overflow: visible !important;
        margin-left: 0 !important;
        margin-right: 28px !important;
        flex: 0 0 ${AVATAR_SIZE}px !important;
        box-sizing: border-box !important;
      }
      [class*="profile-web_header-info"] {
        order: 1 !important;
        flex: 1 1 auto !important;
        min-width: 0 !important;
      }
      .${FRAME_CLASS} {
        width: ${AVATAR_SIZE}px !important;
        height: ${AVATAR_SIZE}px !important;
        perspective: 900px;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        overflow: visible !important;
        flex-shrink: 0 !important;
        box-sizing: border-box !important;
      }
      .${FRAME_CLASS} > img {
        width: ${AVATAR_SIZE}px !important;
        height: ${AVATAR_SIZE}px !important;
        min-width: ${AVATAR_SIZE}px !important;
        min-height: ${AVATAR_SIZE}px !important;
        max-width: ${AVATAR_SIZE}px !important;
        max-height: ${AVATAR_SIZE}px !important;
        border-radius: 22px !important;
        object-fit: cover !important;
        box-sizing: border-box !important;
        border: 4px solid #d4af37 !important;
        box-shadow:
          0 24px 60px rgba(0, 0, 0, 0.45),
          0 0 24px rgba(212, 175, 55, 0.45),
          0 0 0 1px rgba(255, 255, 255, 0.18) inset;
        transform-style: preserve-3d;
        transition: transform 120ms ease-out, box-shadow 120ms ease-out;
        will-change: transform;
      }
    `;
    document.head.appendChild(style);
  }

  function addDarkStyles() {
    if (document.getElementById(DARK_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = DARK_STYLE_ID;
    style.textContent = `
      html, body, #root,
      [class*="profile-web_layout"],
      [class*="profile-web_section-wrapper"],
      [class*="profile-web_tabs-wrapper"] {
        background: #0f1117 !important;
        color: #e6e8ee !important;
      }
      [class*="profile-web_header-wrapper"],
      [class*="profile-web_header-container"] {
        background: linear-gradient(135deg, #171a23 0%, #10131a 100%) !important;
        color: #f3f4f8 !important;
      }
      [class*="profile-web_headerBar-container"] {
        background: rgba(15, 17, 23, 0.92) !important;
        color: #f3f4f8 !important;
        backdrop-filter: blur(12px);
      }
      [class*="profile-web_collapse-card"],
      [class*="corehr-remix-profile-ui-pc-card"],
      [class*="ud__collapse"],
      [class*="ud__collapse-item"],
      [class*="ud__collapse-content"],
      [class*="ud__collapse-content-box"] {
        background: #171a23 !important;
        color: #e6e8ee !important;
        border-color: rgba(255, 255, 255, 0.08) !important;
      }
      [class*="ud__tabs__tab-bar-holder"],
      [class*="ud__tabs__tab-bar-nav"],
      [class*="ud__tabs__content"] {
        background: #0f1117 !important;
        color: #e6e8ee !important;
      }
      [class*="profile-web_profile-name"],
      [class*="profile-web_profile-content-clamp"],
      [class*="corehr-remix-profile-ui-pc-card-header__title"],
      [class*="ud-typography"],
      [class*="profile-web_block"],
      [class*="profile-web_content-fields-element"] {
        color: #e6e8ee !important;
      }
      [class*="profile-web_content-fields-label"],
      [class*="profile-web_content-fields-label"] *,
      [class*="profile-web_introduction-block"],
      [class*="profile-web_placeholder"] {
        color: #9aa3b2 !important;
      }
      [class*="ud__tag"],
      [class*="next-remix-employee-label-tag__tag"] {
        background: #242936 !important;
        color: #e6e8ee !important;
        border-color: rgba(255, 255, 255, 0.08) !important;
      }
      [class*="ud__button"] {
        background: #242936 !important;
        color: #e6e8ee !important;
        border-color: rgba(255, 255, 255, 0.14) !important;
      }
      [class*="ud__button"]:hover { background: #2d3445 !important; }
      a, [class*="profile-web_email"] { color: #7aa2ff !important; }
    `;
    document.head.appendChild(style);
  }

  function getMainAvatarImg() {
    return (
      document.querySelector('.profile-web_profile-avatar--GvbS1 img[alt="avatar"]')
      || document.querySelector('[class*="profile-web_profile-avatar--"] img[alt="avatar"]')
      || document.querySelector('[class*="profile-web_profile-avatar--"] img')
    );
  }

  function enhanceAvatar() {
    const img = getMainAvatarImg();
    if (!img) return;
    if (img.closest(`.${FRAME_CLASS}`)) return;
    if (img.hasAttribute(INIT_ATTR)) return;
    const parent = img.parentElement;
    if (!parent) return;
    img.setAttribute(INIT_ATTR, "true");
    const frame = document.createElement("div");
    frame.className = FRAME_CLASS;
    parent.insertBefore(frame, img);
    frame.appendChild(img);
    function updateTilt(event) {
      const rect = frame.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateY = ((x - centerX) / centerX) * MAX_TILT;
      const rotateX = -((y - centerY) / centerY) * MAX_TILT;
      img.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.04)`;
    }
    function resetTilt() {
      img.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
    }
    frame.addEventListener("mousemove", updateTilt);
    frame.addEventListener("mouseleave", resetTilt);
  }

  function runEnhance() {
    addEnhanceLayoutStyles();
    addDarkStyles();
    enhanceAvatar();
    ensureChartPlacement();
    ensureThemeToggle();
  }

  // ============================================================
  // PokéLark
  // ============================================================
  const POKEMON_COUNT = 1025;
  const SPRITE_SIZE = 110;
  const HASH_SALT = "p10";
  const BADGE_ATTR = "data-feishu-profile-pokemon";
  const POKE_STYLE_ID = "pokelark-style";
  const STORAGE_PREFIX = "pokelark_override_employee_";
  const POKEDEX_STORAGE_KEY = "pokelark_pokedex_v1";
  const RELEASED_STORAGE_KEY = "pokelark_released_v1";
  const NAME_CACHE_STORAGE_KEY = "pokelark_pokemon_name_cache_v1";
  const DEX_NAME_MODE_STORAGE_KEY = "pokelark_dex_name_mode_v1";

  let lastInjectedEmployeeNumber = null;
  let injectTimer = null;

  function hashString(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function getStorageKey(employeeNumber) { return STORAGE_PREFIX + employeeNumber; }

  function getSavedPokemonId(employeeNumber) {
    const raw = localStorage.getItem(getStorageKey(employeeNumber));
    const parsed = Number(raw);
    if (!Number.isInteger(parsed)) return null;
    if (parsed < 1 || parsed > POKEMON_COUNT) return null;
    return parsed;
  }

  function savePokemonId(employeeNumber, pokemonId) {
    localStorage.setItem(getStorageKey(employeeNumber), String(pokemonId));
  }

  function clearSavedPokemonId(employeeNumber) {
    localStorage.removeItem(getStorageKey(employeeNumber));
  }

  function pokemonIdForEmployeeNumber(employeeNumber) {
    const saved = getSavedPokemonId(employeeNumber);
    if (saved) return saved;
    return (hashString(employeeNumber + HASH_SALT) % POKEMON_COUNT) + 1;
  }

  function getEmployeeNumberField() {
    const label = document.querySelector('[data-people-api-key="staff_id"]');
    if (!label) return null;
    return label.closest('[class*="profile-web_content-fields-field"]');
  }

  function getEmployeeNumberValueElement() {
    const field = getEmployeeNumberField();
    if (!field) return null;
    return field.querySelector('[class*="profile-web_content-fields-element"]');
  }

  function getEmployeeNumber() {
    const valueEl = getEmployeeNumberValueElement();
    if (!valueEl) return null;
    const clone = valueEl.cloneNode(true);
    clone.querySelectorAll(`[${BADGE_ATTR}], .pokelark-edit-btn, .pokelark-catch-btn`)
      .forEach(el => el.remove());
    const value = clone.textContent?.trim();
    const match = value?.match(/\b\d{4,}\b/);
    return match ? match[0] : null;
  }

  function getProfileNamePoke() {
    return (
      document.querySelector('[class*="profile-web_profile-name"]')?.textContent?.trim()
      || document.querySelector('[class*="profile-web_title-group"]')?.textContent?.trim()
      || "Unknown person"
    );
  }

  function isOwnProfilePage() {
    const text = document.body.textContent || "";
    const markers = [
      "Additional Employment Info", "Employment and Career History", "Total Rewards",
      "Basic Info", "Leave", "Contract start date", "Contract end date", "Contract type",
      "Regular employee start date", "Seniority date", "Working hours"
    ];
    return markers.some(m => text.includes(m));
  }

  function getAnimatedSpriteUrl(pokemonId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemonId}.gif`;
  }
  function getFallbackSpriteUrl(pokemonId) {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  }
  function getPokemonApiUrl(pokemonId) {
    return `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
  }

  const ANIMATED_EXTRA_IDS = new Set([
    996, 997, 998, 999, 1000, 1005, 1007, 1009, 1011, 1012, 1013, 1018, 1019, 1020, 1021
  ]);

  function hasAnimatedSprite(pokemonId) {
    if (pokemonId <= 989) return true;
    return ANIMATED_EXTRA_IDS.has(pokemonId);
  }

  function setPokemonImage(img, pokemonId) {
    img.alt = `Pokémon #${pokemonId}`;
    img.title = `Pokémon #${pokemonId}`;
    if (hasAnimatedSprite(pokemonId)) {
      img.src = getAnimatedSpriteUrl(pokemonId);
      img.onerror = () => { img.onerror = null; img.src = getFallbackSpriteUrl(pokemonId); };
    } else {
      img.onerror = null;
      img.src = getFallbackSpriteUrl(pokemonId);
    }
  }

  function readJsonStorage(key, fallback = {}) {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : fallback;
      return parsed && typeof parsed === "object" ? parsed : fallback;
    } catch { return fallback; }
  }
  function writeJsonStorage(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function readPokedex() { return readJsonStorage(POKEDEX_STORAGE_KEY, {}); }
  function writePokedex(p) { writeJsonStorage(POKEDEX_STORAGE_KEY, p); }
  function readReleased() { return readJsonStorage(RELEASED_STORAGE_KEY, {}); }
  function writeReleased(r) { writeJsonStorage(RELEASED_STORAGE_KEY, r); }
  function readNameCache() { return readJsonStorage(NAME_CACHE_STORAGE_KEY, {}); }
  function writeNameCache(c) { writeJsonStorage(NAME_CACHE_STORAGE_KEY, c); }

  function getDexNameMode() { return localStorage.getItem(DEX_NAME_MODE_STORAGE_KEY) || "employee"; }
  function setDexNameMode(mode) { localStorage.setItem(DEX_NAME_MODE_STORAGE_KEY, mode); }

  function formatPokemonName(raw) {
    return String(raw || "").split("-")
      .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
  }

  function getCachedPokemonName(pokemonId) {
    return readNameCache()[String(pokemonId)] || null;
  }

  async function fetchAndCachePokemonName(pokemonId) {
    const existing = getCachedPokemonName(pokemonId);
    if (existing) return existing;
    try {
      const response = await fetch(getPokemonApiUrl(pokemonId));
      if (!response.ok) throw new Error("Name fetch failed");
      const data = await response.json();
      const name = formatPokemonName(data?.name);
      if (!name) throw new Error("Missing name");
      const cache = readNameCache();
      cache[String(pokemonId)] = name;
      writeNameCache(cache);
      return name;
    } catch { return null; }
  }

  async function hydrateVisiblePokemonNames() {
    if (getDexNameMode() !== "pokemon") return;
    const labels = document.querySelectorAll(".pokelark-dex-person[data-pokemon-id]");
    for (const label of labels) {
      const pokemonId = Number(label.getAttribute("data-pokemon-id"));
      if (!Number.isInteger(pokemonId)) continue;
      const cached = getCachedPokemonName(pokemonId);
      if (cached) { label.textContent = cached; continue; }
      label.textContent = "Loading name...";
      const fetched = await fetchAndCachePokemonName(pokemonId);
      label.textContent = fetched || `Pokémon #${pokemonId}`;
    }
  }

  function getPokedexKey(pokemonId, employeeNumber) { return `${pokemonId}:${employeeNumber}`; }

  function markReleased(pokemonId, employeeNumber) {
    const r = readReleased(); r[getPokedexKey(pokemonId, employeeNumber)] = true; writeReleased(r);
  }
  function unmarkReleased(pokemonId, employeeNumber) {
    const r = readReleased(); delete r[getPokedexKey(pokemonId, employeeNumber)]; writeReleased(r);
  }
  function isReleased(pokemonId, employeeNumber) {
    return Boolean(readReleased()[getPokedexKey(pokemonId, employeeNumber)]);
  }
  function isCaptured(pokemonId, employeeNumber) {
    return Boolean(readPokedex()[getPokedexKey(pokemonId, employeeNumber)]);
  }

  function releasePokemon(pokemonId, employeeNumber) {
    const pokedex = readPokedex();
    delete pokedex[getPokedexKey(pokemonId, employeeNumber)];
    writePokedex(pokedex);
    markReleased(pokemonId, employeeNumber);
    updatePokedexCount();
    updateCatchButtonStates();
    renderPokedexPanel();
  }

  function capturePokemon(employeeNumber, pokemonId, profileName, source) {
    if (source === "starter" && isReleased(pokemonId, employeeNumber)) return;
    unmarkReleased(pokemonId, employeeNumber);
    const pokedex = readPokedex();
    const key = getPokedexKey(pokemonId, employeeNumber);
    if (!pokedex[key]) {
      pokedex[key] = {
        pokemonId, employeeNumber,
        profileName: profileName || "Unknown person",
        source: source || "profile",
        capturedAt: new Date().toISOString()
      };
      writePokedex(pokedex);
    }
    updatePokedexCount();
    updateCatchButtonStates();
    const panel = document.getElementById("pokelark-dex-panel");
    if (panel?.classList.contains("pokelark-open")) renderPokedexPanel();
  }

  function captureStarterIfNeeded(employeeNumber, pokemonId) {
    if (!isOwnProfilePage()) return;
    capturePokemon(employeeNumber, pokemonId, getProfileNamePoke(), "starter");
  }

  function addPokeStyles() {
    if (document.getElementById(POKE_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = POKE_STYLE_ID;
    style.textContent = `
      [${BADGE_ATTR}] {
        position: relative; display: flex; align-items: center; justify-content: flex-start;
        width: ${SPRITE_SIZE}px; height: ${SPRITE_SIZE}px; margin-bottom: 4px;
      }
      .pokelark-img {
        display: block; width: ${SPRITE_SIZE}px; height: ${SPRITE_SIZE}px;
        object-fit: contain; image-rendering: pixelated;
      }
      .pokelark-edit-btn, .pokelark-catch-btn {
        position: absolute; right: 0;
        border: 1px solid rgba(255,255,255,0.28); border-radius: 999px;
        background: rgba(20,24,33,0.92); color: #f4f6fb;
        font-size: 11px; font-weight: 700; padding: 4px 8px; cursor: pointer;
        opacity: 0; transform: translateY(4px);
        transition: opacity 120ms ease, transform 120ms ease, background 120ms ease;
        z-index: 2;
      }
      .pokelark-edit-btn { bottom: 0; }
      .pokelark-catch-btn { bottom: 30px; }
      [${BADGE_ATTR}]:hover .pokelark-edit-btn,
      [${BADGE_ATTR}]:hover .pokelark-catch-btn { opacity: 1; transform: translateY(0); }
      .pokelark-edit-btn:hover, .pokelark-catch-btn:hover { background: rgba(45,52,69,0.98); }
      .pokelark-catch-btn.pokelark-caught {
        cursor: default; opacity: 0.88; background: rgba(36,41,54,0.92); color: #9aa3b2;
      }
      #pokelark-dex-button {
        position: fixed; right: 18px; bottom: 18px; width: 58px; height: 58px;
        border-radius: 999px; border: 1px solid rgba(255,255,255,0.22);
        background:
          radial-gradient(circle at 50% 50%, #ffffff 0 10%, transparent 11%),
          linear-gradient(to bottom, #e53935 0 48%, #151923 49% 51%, #f4f6fb 52% 100%);
        box-shadow: 0 12px 34px rgba(0,0,0,0.35); cursor: pointer; z-index: 999999;
      }
      #pokelark-dex-count {
        position: absolute; right: -4px; top: -4px;
        min-width: 20px; height: 20px; padding: 0 5px;
        border-radius: 999px; background: #242936; color: #f4f6fb;
        font-size: 11px; font-weight: 800; line-height: 20px; text-align: center;
        border: 1px solid rgba(255,255,255,0.22);
      }
      #pokelark-dex-panel {
        position: fixed; right: 18px; bottom: 88px;
        width: 380px; max-width: calc(100vw - 36px); max-height: 520px;
        display: none; flex-direction: column; border-radius: 20px;
        background: rgba(20,24,33,0.98); border: 1px solid rgba(255,255,255,0.14);
        box-shadow: 0 24px 70px rgba(0,0,0,0.45); color: #eef1f7;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        z-index: 999999; overflow: hidden;
      }
      #pokelark-dex-panel.pokelark-open { display: flex; }
      .pokelark-dex-header {
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.1);
      }
      .pokelark-dex-title { font-size: 14px; font-weight: 800; }
      .pokelark-dex-header-actions { display: flex; align-items: center; gap: 8px; }
      .pokelark-dex-toggle {
        border: 1px solid rgba(255,255,255,0.14); border-radius: 999px;
        background: #242936; color: #f4f6fb;
        font-size: 11px; font-weight: 800; padding: 5px 9px; cursor: pointer;
      }
      .pokelark-dex-toggle:hover { background: #2d3445; }
      .pokelark-dex-close {
        border: 0; background: transparent; color: #9aa3b2;
        font-size: 20px; cursor: pointer; line-height: 1;
      }
      .pokelark-dex-body { padding: 14px; overflow: auto; }
      .pokelark-dex-empty { color: #9aa3b2; font-size: 13px; line-height: 1.5; }
      .pokelark-dex-grid {
        display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px;
      }
      .pokelark-dex-card {
        border-radius: 14px; background: #242936;
        border: 1px solid rgba(255,255,255,0.1); padding: 10px; min-width: 0;
      }
      .pokelark-dex-card img {
        display: block; width: 64px; height: 64px; margin: 0 auto 6px auto;
        object-fit: contain; image-rendering: pixelated;
      }
      .pokelark-dex-number { font-size: 12px; font-weight: 800; text-align: center; color: #f4f6fb; }
      .pokelark-dex-person {
        margin-top: 4px; font-size: 11px; color: #9aa3b2; text-align: center;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .pokelark-dex-date { margin-top: 3px; font-size: 10px; color: #697386; text-align: center; }
      .pokelark-release-btn {
        display: block; width: 100%; margin-top: 8px;
        border: 1px solid rgba(255,255,255,0.14); border-radius: 999px;
        background: rgba(20,24,33,0.9); color: #f4f6fb;
        font-size: 10px; font-weight: 800; padding: 4px 6px; cursor: pointer;
      }
      .pokelark-release-btn:hover {
        background: rgba(120,40,40,0.95); border-color: rgba(255,120,120,0.4);
      }
    `;
    document.head.appendChild(style);
  }

  function createEditButton(employeeNumber, img) {
    const button = document.createElement("button");
    button.className = "pokelark-edit-btn";
    button.type = "button";
    button.textContent = "Edit";
    button.addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      const currentPokemonId = pokemonIdForEmployeeNumber(employeeNumber);
      const input = prompt(
        `Choose a Pokémon number from 1 to ${POKEMON_COUNT}.\n\nCurrent: ${currentPokemonId}\n\nLeave blank to reset to default.`,
        String(currentPokemonId)
      );
      if (input === null) return;
      const trimmed = input.trim();
      if (!trimmed) {
        clearSavedPokemonId(employeeNumber);
        const defaultId = pokemonIdForEmployeeNumber(employeeNumber);
        setPokemonImage(img, defaultId);
        captureStarterIfNeeded(employeeNumber, defaultId);
        return;
      }
      const next = Number(trimmed);
      if (!Number.isInteger(next) || next < 1 || next > POKEMON_COUNT) {
        alert(`Please enter a whole number from 1 to ${POKEMON_COUNT}.`);
        return;
      }
      savePokemonId(employeeNumber, next);
      setPokemonImage(img, next);
      captureStarterIfNeeded(employeeNumber, next);
    });
    return button;
  }

  function createCatchButton(employeeNumber, pokemonId) {
    const button = document.createElement("button");
    button.className = "pokelark-catch-btn";
    button.type = "button";
    button.addEventListener("click", event => {
      event.preventDefault(); event.stopPropagation();
      if (isCaptured(pokemonId, employeeNumber)) return;
      capturePokemon(employeeNumber, pokemonId, getProfileNamePoke(), "captured");
    });
    return button;
  }

  function updateCatchButton(button, employeeNumber, pokemonId) {
    if (isCaptured(pokemonId, employeeNumber)) {
      button.textContent = "Caught";
      button.classList.add("pokelark-caught");
    } else {
      button.textContent = "Catch";
      button.classList.remove("pokelark-caught");
    }
  }

  function updateCatchButtonStates() {
    const wrapper = document.querySelector(`[${BADGE_ATTR}]`);
    if (!wrapper) return;
    const employeeNumber = wrapper.getAttribute("data-employee-number");
    const pokemonId = Number(wrapper.getAttribute("data-pokemon-id"));
    const button = wrapper.querySelector(".pokelark-catch-btn");
    if (employeeNumber && pokemonId && button) updateCatchButton(button, employeeNumber, pokemonId);
  }

  function updateActionButtons(wrapper, employeeNumber, img) {
    const pokemonId = pokemonIdForEmployeeNumber(employeeNumber);
    wrapper.setAttribute("data-pokemon-id", String(pokemonId));
    let editButton = wrapper.querySelector(".pokelark-edit-btn");
    let catchButton = wrapper.querySelector(".pokelark-catch-btn");
    if (isOwnProfilePage()) {
      if (!editButton) { editButton = createEditButton(employeeNumber, img); wrapper.appendChild(editButton); }
      if (catchButton) catchButton.remove();
      captureStarterIfNeeded(employeeNumber, pokemonId);
      return;
    }
    if (editButton) editButton.remove();
    if (!catchButton) { catchButton = createCatchButton(employeeNumber, pokemonId); wrapper.appendChild(catchButton); }
    updateCatchButton(catchButton, employeeNumber, pokemonId);
  }

  function createPokemonImage(employeeNumber) {
    const pokemonId = pokemonIdForEmployeeNumber(employeeNumber);
    const wrapper = document.createElement("div");
    wrapper.setAttribute(BADGE_ATTR, "true");
    wrapper.setAttribute("data-employee-number", employeeNumber);
    wrapper.setAttribute("data-pokemon-id", String(pokemonId));
    const img = document.createElement("img");
    img.className = "pokelark-img";
    img.width = SPRITE_SIZE; img.height = SPRITE_SIZE;
    setPokemonImage(img, pokemonId);
    wrapper.appendChild(img);
    updateActionButtons(wrapper, employeeNumber, img);
    return wrapper;
  }

  function injectPokemon() {
    addPokeStyles();
    createPokedexUi();
    const employeeNumber = getEmployeeNumber();
    if (!employeeNumber) return;
    const valueEl = getEmployeeNumberValueElement();
    if (!valueEl) return;
    const existing = document.querySelector(`[${BADGE_ATTR}]`);
    if (existing && existing.getAttribute("data-employee-number") === employeeNumber) {
      const img = existing.querySelector(".pokelark-img");
      if (img) updateActionButtons(existing, employeeNumber, img);
      return;
    }
    if (existing) existing.remove();
    lastInjectedEmployeeNumber = employeeNumber;
    valueEl.prepend(createPokemonImage(employeeNumber));
  }

  function formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch { return ""; }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  }

  function getCapturedEntries() {
    return Object.values(readPokedex())
      .filter(e => e && Number.isInteger(Number(e.pokemonId)))
      .sort((a, b) => Number(a.pokemonId) - Number(b.pokemonId));
  }

  function updatePokedexCount() {
    const el = document.getElementById("pokelark-dex-count");
    if (el) el.textContent = String(getCapturedEntries().length);
  }

  function renderPokedexPanel() {
    const body = document.querySelector("#pokelark-dex-panel .pokelark-dex-body");
    if (!body) return;
    const entries = getCapturedEntries();
    const mode = getDexNameMode();
    const toggle = document.querySelector(".pokelark-dex-toggle");
    if (toggle) toggle.textContent = mode === "employee" ? "Names: Employee" : "Names: Pokémon";
    if (!entries.length) {
      body.innerHTML = `<div class="pokelark-dex-empty">No Pokémon caught yet. Visit someone else’s profile and catch their Pokémon.</div>`;
      updatePokedexCount();
      return;
    }
    body.innerHTML = `
      <div class="pokelark-dex-grid">
        ${entries.map(entry => {
          const pid = Number(entry.pokemonId);
          const cached = getCachedPokemonName(pid);
          const displayName = mode === "pokemon"
            ? (cached || `Pokémon #${pid}`)
            : (entry.profileName || "Unknown person");
          return `
            <div class="pokelark-dex-card" title="${escapeHtml(displayName)}">
              <img src="${escapeHtml(getAnimatedSpriteUrl(pid))}" alt="Pokémon #${escapeHtml(pid)}">
              <div class="pokelark-dex-number">#${escapeHtml(pid)}</div>
              <div class="pokelark-dex-person" data-pokemon-id="${escapeHtml(pid)}">${escapeHtml(displayName)}</div>
              <div class="pokelark-dex-date">${escapeHtml(formatDate(entry.capturedAt))}</div>
              <button class="pokelark-release-btn" type="button"
                data-pokemon-id="${escapeHtml(pid)}"
                data-employee-number="${escapeHtml(entry.employeeNumber)}">Release</button>
            </div>
          `;
        }).join("")}
      </div>
    `;
    body.querySelectorAll(".pokelark-release-btn").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault(); event.stopPropagation();
        const pid = Number(button.getAttribute("data-pokemon-id"));
        const emp = button.getAttribute("data-employee-number");
        if (!Number.isInteger(pid) || !emp) return;
        if (!confirm(`Release Pokémon #${pid}?`)) return;
        releasePokemon(pid, emp);
      });
    });
    updatePokedexCount();
    hydrateVisiblePokemonNames();
  }

  function createPokedexUi() {
    if (document.getElementById("pokelark-dex-button")) { updatePokedexCount(); return; }
    const button = document.createElement("button");
    button.id = "pokelark-dex-button";
    button.type = "button";
    button.title = "Open Pokédex";
    const count = document.createElement("div");
    count.id = "pokelark-dex-count";
    button.appendChild(count);
    const panel = document.createElement("div");
    panel.id = "pokelark-dex-panel";
    panel.innerHTML = `
      <div class="pokelark-dex-header">
        <div class="pokelark-dex-title">Lark Pokédex</div>
        <div class="pokelark-dex-header-actions">
          <button class="pokelark-dex-toggle" type="button">Names: Employee</button>
          <button class="pokelark-dex-close" type="button" title="Close">×</button>
        </div>
      </div>
      <div class="pokelark-dex-body"></div>
    `;
    button.addEventListener("click", () => { panel.classList.toggle("pokelark-open"); renderPokedexPanel(); });
    panel.querySelector(".pokelark-dex-close").addEventListener("click", () => panel.classList.remove("pokelark-open"));
    panel.querySelector(".pokelark-dex-toggle").addEventListener("click", () => {
      setDexNameMode(getDexNameMode() === "employee" ? "pokemon" : "employee");
      renderPokedexPanel();
    });
    document.body.appendChild(button);
    document.body.appendChild(panel);
    updatePokedexCount();
  }

  function shouldIgnoreMutation(mutation) {
    const nodes = [...mutation.addedNodes, ...mutation.removedNodes];
    if (nodes.length === 0) return true;
    return nodes.every(node => {
      if (!(node instanceof HTMLElement)) return false;
      return (
        node.id === "pokelark-dex-button"
        || node.id === "pokelark-dex-panel"
        || node.id === POKE_STYLE_ID
        || node.id === TOGGLE_ID
        || node.id === CHART_ID
        || node.id === IFRAME_ID
        || node.hasAttribute?.(BADGE_ATTR)
        || node.closest?.(`#pokelark-dex-button, #pokelark-dex-panel, [${BADGE_ATTR}], #${TOGGLE_ID}, #${CHART_ID}`)
      );
    });
  }

  function scheduleInject() {
    clearTimeout(injectTimer);
    injectTimer = setTimeout(() => {
      const employeeNumber = getEmployeeNumber();
      if (!employeeNumber) { injectPokemon(); return; }
      if (employeeNumber !== lastInjectedEmployeeNumber) { injectPokemon(); return; }
      if (!document.querySelector(`[${BADGE_ATTR}]`)) injectPokemon();
    }, 350);
  }

  // ============================================================
  // LeaderChain
  // ============================================================
  const MAX_DEPTH = 8;
  const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const INCLUDE_CURRENT_PERSON = false;
  const INITIAL_PROFILE_WAIT_MS = 15000;
  const IFRAME_PROFILE_WAIT_MS = 12000;
  const CHAIN_STYLE_ID = "feishu-leader-chain-chart-style";
  const CHART_ID = "feishu-leader-chain-chart";
  const IFRAME_ID = "feishu-leader-chain-hidden-frame";
  const CACHE_PREFIX = "feishu_leader_chain_profile_v2:";

  function getCurrentProfileId() {
    return new URLSearchParams(window.location.search).get("id");
  }
  function profileUrl(id) {
    return `https://people.bytedance.net/people/profile?id=${encodeURIComponent(id)}&sourceFrom=leader_chain&open_type=open_in_page`;
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function cleanName(v) { return String(v || "").replace(/\s+/g, " ").trim(); }

  function preferEnglishFullName(primary, fallback) {
    primary = cleanName(primary);
    fallback = cleanName(fallback);
    if (!primary) return fallback || "Unknown person";
    if (!fallback) return primary;
    if (fallback.includes("(") && fallback.includes(")") && !primary.includes("(")) return fallback;
    return primary;
  }

  function getProfileName(doc = document) {
    return cleanName(
      doc.querySelector('[class*="profile-web_profile-name"]')?.textContent
      || doc.querySelector('[class*="profile-web_title-group"]')?.textContent
      || "Unknown person"
    );
  }

  function getProfileAvatar(doc = document) {
    return (
      doc.querySelector('[class*="profile-web_profile-avatar"] img')?.getAttribute("src")
      || doc.querySelector('[class*="profile-web_avatar"] img')?.getAttribute("src")
      || null
    );
  }

  function getDirectLeader(doc = document) {
    const label = doc.querySelector('[data-people-api-key="direct_leader_name"]');
    if (!label) return null;
    const field = label.closest('[class*="profile-web_content-fields-field"]');
    if (!field) return null;
    const card = field.querySelector("ee-user-card[data-user-id]");
    if (!card) return null;
    const id = card.getAttribute("data-user-id");
    if (!id) return null;
    const nameFromWholeCard = cleanName(card.textContent);
    const nameFromInner =
      cleanName(field.querySelector('[class*="profile-web_employee-lable-name"]')?.textContent)
      || cleanName(field.querySelector('[class*="next-remix-employee-label-tag__name"]')?.textContent)
      || cleanName(field.querySelector('[class*="ud__tag__content"]')?.textContent)
      || "Unknown leader";
    const name = preferEnglishFullName(nameFromInner, nameFromWholeCard);
    const avatar = field.querySelector("img")?.getAttribute("src") || null;
    return { id, name, avatar };
  }

  function employmentInfoLoaded(doc = document) {
    return Boolean(
      doc.querySelector('[data-people-api-key="direct_leader_name"]')
      || doc.querySelector('[data-people-api-key="staff_id"]')
      || doc.querySelector('[data-people-api-key="work_email"]')
    );
  }

  async function waitForInitialProfileReady() {
    const start = Date.now();
    renderLoadingChart("Loading profile fields...");
    while (Date.now() - start < INITIAL_PROFILE_WAIT_MS) {
      if (employmentInfoLoaded(document)) { await sleep(500); return; }
      renderLoadingChart("Loading profile fields...");
      await sleep(250);
    }
  }

  function getCache(id) {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + id);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      if (!cached || Date.now() - cached.savedAt > CACHE_TTL_MS) {
        localStorage.removeItem(CACHE_PREFIX + id);
        return null;
      }
      return cached.data;
    } catch { return null; }
  }

  function setCache(id, data) {
    try { localStorage.setItem(CACHE_PREFIX + id, JSON.stringify({ savedAt: Date.now(), data })); }
    catch {}
  }

  function getOrCreateHiddenIframe() {
    let iframe = document.getElementById(IFRAME_ID);
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = IFRAME_ID;
      Object.assign(iframe.style, {
        position: "fixed", left: "-99999px", top: "-99999px",
        width: "1200px", height: "900px",
        opacity: "0", pointerEvents: "none", zIndex: "-1"
      });
      document.body.appendChild(iframe);
    }
    return iframe;
  }

  async function waitForProfileRender(iframe, expectedId) {
    const start = Date.now();
    let best = null;
    while (Date.now() - start < IFRAME_PROFILE_WAIT_MS) {
      const doc = iframe.contentDocument;
      if (doc) {
        const name = getProfileName(doc);
        const avatar = getProfileAvatar(doc);
        const leader = getDirectLeader(doc);
        if (name && name !== "Unknown person") {
          best = { id: expectedId, name, avatar, leader };
          if (employmentInfoLoaded(doc) && leader) return best;
          if (employmentInfoLoaded(doc) && Date.now() - start > 2500) return best;
          if (Date.now() - start > 8000) return best;
        }
      }
      await sleep(200);
    }
    if (best) return best;
    throw new Error(`Timed out loading profile ${expectedId}`);
  }

  async function loadRenderedProfile(id) {
    const cached = getCache(id);
    if (cached) return cached;
    const iframe = getOrCreateHiddenIframe();
    iframe.src = profileUrl(id);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Iframe load timeout for ${id}`)), IFRAME_PROFILE_WAIT_MS);
      iframe.onload = () => { clearTimeout(timeout); resolve(); };
    });
    await sleep(1200);
    const profile = await waitForProfileRender(iframe, id);
    setCache(id, profile);
    return profile;
  }

  async function buildLeaderChain(onProgress) {
    const chain = [];
    const currentId = getCurrentProfileId();
    await waitForInitialProfileReady();
    const currentProfile = {
      id: currentId,
      name: getProfileName(document),
      avatar: getProfileAvatar(document),
      type: "current"
    };
    let nextLeader = getDirectLeader(document);
    if (!nextLeader) {
      renderLoadingChart("No direct leader found after waiting. This profile may not expose a direct leader.");
      await sleep(1400);
      return chain;
    }
    for (let depth = 0; nextLeader && depth < MAX_DEPTH; depth++) {
      if (chain.some(p => p.id === nextLeader.id)) break;
      const partial = { id: nextLeader.id, name: nextLeader.name, avatar: nextLeader.avatar, type: "leader" };
      chain.push(partial);
      onProgress?.(chain, false);
      try {
        const rendered = await loadRenderedProfile(nextLeader.id);
        chain[chain.length - 1] = {
          id: rendered.id,
          name: preferEnglishFullName(rendered.name, partial.name),
          avatar: rendered.avatar || partial.avatar,
          type: "leader"
        };
        onProgress?.(chain, false);
        nextLeader = rendered.leader;
      } catch { break; }
    }
    if (INCLUDE_CURRENT_PERSON) chain.push(currentProfile);
    return chain;
  }

  function addChainStyles() {
    if (document.getElementById(CHAIN_STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = CHAIN_STYLE_ID;
    style.textContent = `
      #${CHART_ID} {
        margin: 16px 0 0 0; padding: 16px; border-radius: 18px;
        background: linear-gradient(135deg, rgba(31,36,48,0.94), rgba(20,24,33,0.94));
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 16px 48px rgba(0,0,0,0.28);
        color: #eef1f7;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        max-width: 100%;
      }
      .feishu-leader-chart-title { font-size: 14px; font-weight: 700; margin-bottom: 14px; color: #f4f6fb; }
      .feishu-leader-chart-loading { font-size: 13px; color: #9aa3b2; }
      .feishu-leader-chart-row {
        display: flex; align-items: center; gap: 10px;
        overflow-x: auto; padding-bottom: 4px;
      }
      .feishu-leader-chart-card {
        min-width: 160px; max-width: 230px; padding: 10px 12px; border-radius: 16px;
        background: #242936; border: 1px solid rgba(255,255,255,0.1);
        color: #f4f6fb; text-decoration: none;
        box-shadow: 0 8px 24px rgba(0,0,0,0.22);
        flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
      }
      .feishu-leader-chart-card:hover { background: #2d3445; text-decoration: none; }
      .feishu-leader-chart-card-current {
        border-color: rgba(122,162,255,0.75);
        box-shadow: 0 0 0 1px rgba(122,162,255,0.25), 0 8px 24px rgba(0,0,0,0.22);
      }
      .feishu-leader-chart-avatar {
        width: 42px; height: 42px; min-width: 42px; min-height: 42px;
        border-radius: 12px; object-fit: cover;
        background: #11151f; border: 1px solid rgba(255,255,255,0.14);
      }
      .feishu-leader-chart-avatar-placeholder {
        width: 42px; height: 42px; min-width: 42px; min-height: 42px;
        border-radius: 12px; background: #333b4f; border: 1px solid rgba(255,255,255,0.14);
      }
      .feishu-leader-chart-text { min-width: 0; }
      .feishu-leader-chart-name {
        font-size: 13px; font-weight: 700;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .feishu-leader-chart-arrow { color: #7aa2ff; font-size: 18px; opacity: 0.9; flex: 0 0 auto; }

      [data-combo-theme="light"] #${CHART_ID} {
        background: linear-gradient(135deg, #ffffff 0%, #f4f6fb 100%);
        border: 1px solid rgba(15, 17, 23, 0.10);
        box-shadow: 0 16px 48px rgba(15, 17, 23, 0.10);
        color: #1f2430;
      }
      [data-combo-theme="light"] .feishu-leader-chart-title { color: #1f2430; }
      [data-combo-theme="light"] .feishu-leader-chart-loading { color: #5b6373; }
      [data-combo-theme="light"] .feishu-leader-chart-card {
        background: #ffffff;
        border: 1px solid rgba(15, 17, 23, 0.10);
        color: #1f2430;
        box-shadow: 0 8px 24px rgba(15, 17, 23, 0.08);
      }
      [data-combo-theme="light"] .feishu-leader-chart-card:hover { background: #eef1f7; }
      [data-combo-theme="light"] .feishu-leader-chart-card-current {
        border-color: rgba(58, 110, 230, 0.55);
        box-shadow: 0 0 0 1px rgba(58, 110, 230, 0.20), 0 8px 24px rgba(15, 17, 23, 0.08);
      }
      [data-combo-theme="light"] .feishu-leader-chart-avatar {
        background: #eef1f7;
        border: 1px solid rgba(15, 17, 23, 0.10);
      }
      [data-combo-theme="light"] .feishu-leader-chart-avatar-placeholder {
        background: #dde2ec;
        border: 1px solid rgba(15, 17, 23, 0.10);
      }
      [data-combo-theme="light"] .feishu-leader-chart-arrow { color: #3a6ee6; }
    `;
    document.head.appendChild(style);
  }

  function findInsertionTarget() {
    return document.querySelector('[class*="profile-web_header-info"]');
  }

  function ensureChartPlacement() {
    const chart = document.getElementById(CHART_ID);
    const target = findInsertionTarget();
    if (!chart || !target) return;
    if (chart.parentElement !== target) target.appendChild(chart);
  }

  function createOrGetChart() {
    const target = findInsertionTarget();
    let chart = document.getElementById(CHART_ID);
    if (chart) {
      if (target && chart.parentElement !== target) target.appendChild(chart);
      return chart;
    }
    if (!target) return null;
    chart = document.createElement("div");
    chart.id = CHART_ID;
    target.appendChild(chart);
    return chart;
  }

  function renderLoadingChart(message = "Loading leader chain...") {
    const chart = createOrGetChart();
    if (!chart) return;
    chart.innerHTML = `
      <div class="feishu-leader-chart-title">Leader Chain</div>
      <div class="feishu-leader-chart-loading">${escapeHtml(message)}</div>
    `;
  }

  function renderChart(chain, isDone = true) {
    const chart = createOrGetChart();
    if (!chart) return;
    if (!chain.length) {
      chart.innerHTML = `
        <div class="feishu-leader-chart-title">Leader Chain</div>
        <div class="feishu-leader-chart-loading">No direct leader found.</div>
      `;
      return;
    }
    const rowHtml = chain.map((person, index) => {
      const isCurrent = person.type === "current";
      const cardClass = isCurrent
        ? "feishu-leader-chart-card feishu-leader-chart-card-current"
        : "feishu-leader-chart-card";
      const avatarHtml = person.avatar
        ? `<img class="feishu-leader-chart-avatar" src="${escapeHtml(person.avatar)}" alt="">`
        : `<div class="feishu-leader-chart-avatar-placeholder"></div>`;
      const card = `
        <a class="${cardClass}" href="${profileUrl(person.id)}" title="${escapeHtml(person.name)}">
          ${avatarHtml}
          <div class="feishu-leader-chart-text">
            <div class="feishu-leader-chart-name">${escapeHtml(person.name)}</div>
          </div>
        </a>
      `;
      const arrow = index < chain.length - 1 ? `<div class="feishu-leader-chart-arrow">→</div>` : "";
      return card + arrow;
    }).join("");
    chart.innerHTML = `
      <div class="feishu-leader-chart-title">Leader Chain${isDone ? "" : " · loading..."}</div>
      <div class="feishu-leader-chart-row">${rowHtml}</div>
    `;
  }

  let lastProfileId = null;
  let leaderChainRunning = false;

  async function initLeaderChain() {
    const profileId = getCurrentProfileId();
    if (!profileId || leaderChainRunning) return;
    leaderChainRunning = true;
    lastProfileId = profileId;
    addChainStyles();
    renderLoadingChart("Loading leader chain...");
    try {
      const chain = await buildLeaderChain(partial => renderChart(partial, false));
      renderChart(chain, true);
    } catch {
      renderLoadingChart("Could not load leader chain. Try refreshing after the profile finishes loading.");
    } finally {
      leaderChainRunning = false;
    }
  }

  function watchUrlChanges() {
    setInterval(() => {
      const currentId = getCurrentProfileId();
      if (currentId && currentId !== lastProfileId) {
        document.getElementById(CHART_ID)?.remove();
        document.getElementById(IFRAME_ID)?.remove();
        initLeaderChain();
      }
    }, 600);
  }

  // ============================================================
  // Unified boot / observer
  // ============================================================
  function startObserver() {
    const observer = new MutationObserver(mutations => {
      if (mutations.every(shouldIgnoreMutation)) return;
      window.requestAnimationFrame(runEnhance);
      scheduleInject();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function watchSystemTheme() {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (getStoredTheme() === "system") applyTheme(); };
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  function boot() {
    addThemeStyles();
    runEnhance();
    applyTheme();
    injectPokemon();
    setTimeout(initLeaderChain, 800);
    startObserver();
    watchUrlChanges();
    watchSystemTheme();
    setTimeout(ensureThemeToggle, 1500);
    maybePing();
  }

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
})();
