// popup.js - handles toggles + version display

const STORAGE_ENABLED      = "lbxd_enabled";
const STORAGE_SHOW_BOOK    = "lbxd_showBook";
const STORAGE_SHOW_REMAKE  = "lbxd_showRemake";
const STORAGE_SHOW_COUNTRY = "lbxd_showCountry";

document.addEventListener("DOMContentLoaded", () => {
  const enabledCheckbox = document.getElementById("toggle-enabled");
  const bookCheckbox    = document.getElementById("toggle-book");
  const remakeCheckbox  = document.getElementById("toggle-remake");
  const countryCheckbox = document.getElementById("toggle-country");
  const versionSpan     = document.getElementById("lbxd-version");

  // 1) Show extension version from manifest
  try {
    const manifest = chrome.runtime.getManifest();
    if (manifest && manifest.version && versionSpan) {
      versionSpan.textContent = manifest.version;
    }
  } catch (e) {
    console.warn("[LBXD popup] Could not read manifest version", e);
  }

  if (!enabledCheckbox || !bookCheckbox || !remakeCheckbox || !countryCheckbox) {
    console.warn("[LBXD popup] Toggle elements missing");
    return;
  }

  // 2) Load saved settings (defaults: everything enabled)
  const defaults = {
    [STORAGE_ENABLED]: true,
    [STORAGE_SHOW_BOOK]: true,
    [STORAGE_SHOW_REMAKE]: true,
    [STORAGE_SHOW_COUNTRY]: true,
  };

  chrome.storage.local.get(defaults, (items) => {
    enabledCheckbox.checked = items[STORAGE_ENABLED];
    bookCheckbox.checked    = items[STORAGE_SHOW_BOOK];
    remakeCheckbox.checked  = items[STORAGE_SHOW_REMAKE];
    countryCheckbox.checked = items[STORAGE_SHOW_COUNTRY];
  });

  // 3) Save when user changes any toggle
function saveSettings() {
  chrome.storage.local.set({
    [STORAGE_ENABLED]: enabledCheckbox.checked,
    [STORAGE_SHOW_BOOK]: bookCheckbox.checked,
    [STORAGE_SHOW_REMAKE]: remakeCheckbox.checked,
    [STORAGE_SHOW_COUNTRY]: countryCheckbox.checked,
  }, () => {
    // After settings are saved, reload the active Letterboxd tab (if any)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.warn("[LBXD popup] tabs.query error:", chrome.runtime.lastError);
        return;
      }

      const tab = tabs[0];
      if (!tab || !tab.id || !tab.url) return;

      if (tab.url.startsWith("https://letterboxd.com/")) {
        chrome.tabs.reload(tab.id, () => {
          if (chrome.runtime.lastError) {
            console.warn("[LBXD popup] tabs.reload error:", chrome.runtime.lastError);
          }
        });
      }
    });
  });
}

  enabledCheckbox.addEventListener("change", saveSettings);
  bookCheckbox.addEventListener("change", saveSettings);
  remakeCheckbox.addEventListener("change", saveSettings);
  countryCheckbox.addEventListener("change", saveSettings);
});