function showToast(msg, duration = 2000) {
  let t = document.querySelector('.toast');
  if (!t) {
    t = document.createElement('div');
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._hide);
  t._hide = setTimeout(() => t.classList.remove('show'), duration);
}

function toggleCard(el) {
  el.classList.toggle('expanded');
}

function toggleCollapsible(el) {
  el.classList.toggle('open');
}

function toggleCheck(el) {
  el.classList.toggle('checked');
}

function setActiveTab(tabId) {
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const el = document.querySelector(`[data-tab="${tabId}"]`);
  if (el) el.classList.add('active');
}

document.addEventListener('click', function(e) {
  const card = e.target.closest('.result-card');
  if (card) toggleCard(card);
  const coll = e.target.closest('.collapsible-header');
  if (coll) toggleCollapsible(coll.parentElement);
  const check = e.target.closest('.list-item-check');
  if (check) toggleCheck(check.closest('.list-item'));
  const chip = e.target.closest('.chip:not(.chip-filled)');
  if (chip) chip.classList.toggle('active');
});
