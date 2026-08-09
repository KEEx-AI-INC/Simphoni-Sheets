/* SPDX-License-Identifier: MPL-2.0 */
var brandProductName = 'SimphoniSheets';
var brandProductURL = 'https://simphoni.ai/sheets';
var brandProductFAQURL = 'https://simphoni.ai/support';

// Collabora restores its stored theme after this branding file initially runs.
// Re-apply the product default through that startup window, then leave any
// later choice from its theme picker alone.
function applyDarkDefault() {
  var root = document.documentElement;
  root.setAttribute('data-theme', 'dark');
  root.style.setProperty('--color-main-background', '#26142f', 'important');
  root.style.setProperty('--color-background', '#26142f', 'important');
  root.style.setProperty('--color-background-lighter', '#321a3e', 'important');
  root.style.setProperty('--color-background-hover', '#412454', 'important');
  root.style.setProperty('--color-border', '#76538f', 'important');
  root.style.setProperty('--color-main-text', '#f7f0ff', 'important');
}

applyDarkDefault();
[0, 150, 500, 1200, 2500].forEach(function (delay) {
  window.setTimeout(applyDarkDefault, delay);
});

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
