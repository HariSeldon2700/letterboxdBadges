// popup.js - handles toggles + version display

// We'll reuse these keys later in content.js if you want real control
const STORAGE_ENABLED      = "lbxd_enabled";
const STORAGE_SHOW_BOOK = "lbxd_showBook";
const STORAGE_SHOW_REMAKE = "lbxd_showRemake";
const STORAGE_SHOW_COUNTRY = "lbxd_showCountry";

document.addEventListener("DOMContentLoaded", () => {
  const bookCheckbox = document.getElementById("toggle-book");
  const remakeCheckbox = document.getElementById("toggle-remake");
  const countryCheckbox = document.getElementById("toggle-country");
  const versionSpan = document.getElementById("lbxd-version");

  // 1) Show extension version from manifest
  try {
    const manifest = chrome.runtime.getManifest();
    if (manifest && manifest.version && versionSpan) {
      versionSpan.textContent = manifest.version;
    }
  } catch (e) {
    console.warn("[LBXD popup] Could not read manifest version", e);
  }

  if (!bookCheckbox || !remakeCheckbox || !countryCheckbox) {
    console.warn("[LBXD popup] Toggle elements missing");
    return;
  }

  // 2) Load saved settings (with defaults = true)
  const defaults = {
    [STORAGE_SHOW_BOOK]: true,
    [STORAGE_SHOW_REMAKE]: true,
    [STORAGE_SHOW_COUNTRY]: true,
  };

  chrome.storage.sync.get(defaults, (items) => {
    bookCheckbox.checked = items[STORAGE_SHOW_BOOK];
    remakeCheckbox.checked = items[STORAGE_SHOW_REMAKE];
    countryCheckbox.checked = items[STORAGE_SHOW_COUNTRY];
  });

  // 3) Save when user changes any toggle
  function saveSettings() {
    chrome.storage.sync.set({
      [STORAGE_SHOW_BOOK]: bookCheckbox.checked,
      [STORAGE_SHOW_REMAKE]: remakeCheckbox.checked,
      [STORAGE_SHOW_COUNTRY]: countryCheckbox.checked,
    });
  }

  bookCheckbox.addEventListener("change", saveSettings);
  remakeCheckbox.addEventListener("change", saveSettings);
  countryCheckbox.addEventListener("change", saveSettings);
});