const dayLinks = [...document.querySelectorAll('.day-nav a')];
const days = [...document.querySelectorAll('.day')];

function showDay() {
  const selected = days.find(day => '#' + day.id === window.location.hash) ?? days[0];
  for (const day of days) day.hidden = day !== selected;
  for (const link of dayLinks) {
    if (link.hash === '#' + selected.id) link.setAttribute('aria-current', 'date');
    else link.removeAttribute('aria-current');
  }
}

for (const link of dayLinks) {
  link.addEventListener('click', event => {
    if (event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    event.preventDefault();
    if (window.location.hash !== link.hash) window.history.pushState(null, '', link.hash);
    showDay();
  });
}

window.addEventListener('hashchange', showDay);
window.addEventListener('popstate', showDay);
showDay();
