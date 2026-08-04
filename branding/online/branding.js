/* SPDX-License-Identifier: MPL-2.0 */
var brandProductName = 'SimphoniSheets';
var brandProductURL = 'https://simphoni.ai/sheets';
var brandProductFAQURL = 'https://simphoni.ai/support';

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
