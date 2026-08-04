const apiBase = window.__SIMPHONI_RUNTIME_CONFIG__?.endpoints?.sheetsBase || '';
const list = document.querySelector('#workbooks');
const empty = document.querySelector('#empty');
const search = document.querySelector('#search');
let workbooks = [];

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  if (!response.ok) throw new Error(`Sheets request failed (${response.status})`);
  return response.status === 204 ? null : response.json();
}

function render() {
  const query = search.value.trim().toLowerCase();
  const visible = workbooks.filter((workbook) => workbook.title.toLowerCase().includes(query));
  list.replaceChildren(...visible.map((workbook) => {
    const card = document.createElement('article');
    card.className = 'workbook';
    card.role = 'listitem';
    const title = document.createElement('h3');
    title.textContent = workbook.title;
    const meta = document.createElement('p');
    meta.textContent = `${workbook.format.toUpperCase()} · ${workbook.syncState || 'device only'}`;
    const open = document.createElement('button');
    open.textContent = 'Open in SimphoniSheets';
    open.addEventListener('click', () => request(`/api/sheets/local/v1/documents/${encodeURIComponent(workbook.id)}/open`, { method: 'POST' }));
    card.append(title, meta, open);
    return card;
  }));
  empty.hidden = visible.length > 0;
}

async function refresh() {
  const payload = await request('/api/sheets/local/v1/documents');
  workbooks = payload.documents || [];
  render();
}

search.addEventListener('input', render);
document.querySelector('#new-workbook').addEventListener('click', async () => {
  await request('/api/sheets/local/v1/documents', { method: 'POST', body: JSON.stringify({ format: 'xlsx' }) });
  await refresh();
});
document.querySelector('#import-workbook').addEventListener('click', () => request('/api/sheets/local/v1/import-picker', { method: 'POST' }));
document.querySelector('#sync-workbooks').addEventListener('click', () => request('/api/sheets/local/v1/sync', { method: 'POST', body: JSON.stringify({ mode: 'explicit' }) }));
refresh().catch((error) => { empty.textContent = error.message; empty.hidden = false; });
