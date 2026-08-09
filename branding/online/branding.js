/* SPDX-License-Identifier: MPL-2.0 */
var brandProductName = 'Simphoni Sheets';
var brandProductURL = 'https://simphoni.ai/sheets';
var brandProductFAQURL = 'https://simphoni.ai/support';

// Collabora restores its stored theme after this branding file initially runs.
// Re-apply the product default through that startup window, then leave any
// later choice from its theme picker alone.
function applyDarkDefault() {
  var root = document.documentElement;
  root.setAttribute('data-theme', 'dark');
  // Keep the persisted workbook palette and the editor chrome in agreement.
  // Collabora otherwise restores these older values after the stylesheet loads.
  root.style.setProperty('--color-main-background', '#19171b', 'important');
  root.style.setProperty('--color-background', '#19171b', 'important');
  root.style.setProperty('--color-background-lighter', '#211b24', 'important');
  root.style.setProperty('--color-background-hover', '#2a252e', 'important');
  root.style.setProperty('--color-border', '#3c383d', 'important');
  root.style.setProperty('--color-main-text', '#b09ab8', 'important');
  root.style.setProperty('--color-calc-grid', '#3c383d', 'important');
}

applyDarkDefault();
// The saved Collabora preference is applied asynchronously, often after its
// toolbar finishes rendering. Keep the product default through that bounded
// startup window, then stop observing so a later user-selected theme wins.
var darkDefaultDeadline = Date.now() + 15000;
var darkDefaultObserver = new MutationObserver(function () {
  if (Date.now() >= darkDefaultDeadline) {
    darkDefaultObserver.disconnect();
    return;
  }
  if (document.documentElement.getAttribute('data-theme') !== 'dark') {
    applyDarkDefault();
  }
});
darkDefaultObserver.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});
window.setTimeout(function () {
  darkDefaultObserver.disconnect();
}, 15000);

window.addEventListener('load', function () {
  function wireBranding() {
    var logo = document.querySelector('#document-header > a');
    if (!logo) {
      window.setTimeout(wireBranding, 250);
      return;
    }
    logo.setAttribute('data-cooltip', brandProductName);
    logo.setAttribute('href', brandProductURL);
    logo.setAttribute('target', '_blank');
    logo.setAttribute('rel', 'noopener noreferrer');
  }

  function addUpstreamAttribution() {
    var version = document.getElementById('lokit-version');
    var about = document.getElementById('about-dialog-info');
    if (!version || !about) {
      window.setTimeout(addUpstreamAttribution, 250);
      return;
    }
    if (document.getElementById('simphoni-sheets-upstream')) return;
    var attribution = document.createElement('p');
    attribution.id = 'simphoni-sheets-upstream';
    attribution.textContent = 'Built with Collabora Online and LibreOffice.';
    about.appendChild(attribution);
  }

  wireBranding();
  addUpstreamAttribution();
});
