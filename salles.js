const form = document.querySelector('.room-form');
const input = document.querySelector('#village');
const options = document.querySelector('#village-list');
const answer = document.querySelector('#room-answer');
const status = document.querySelector('#search-status');
const resultTemplate = document.querySelector('#room-result');

function normalize(value) {
  return value.toLocaleLowerCase('fr')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]/g, '');
}

const aliases = {
  'Arcs Panorama': ['Les Arcs', 'Les Arcs Panorama'],
  'Pragelato-Sestriere': ['Pragelato Vialattea'],
};
const directory = villages.map(village => ({
  village,
  keys: [village.name, ...(aliases[village.name] ?? [])].map(normalize),
}));

const picker = document.querySelector('.village-picker');
options.append(...villageButtons(villages));

input.addEventListener('focus', () => { picker.open = true; });

function element(tag, className, content) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = content;
  return node;
}

function showVillage(village) {
  input.value = village.name;
  picker.open = false;
  const result = resultTemplate.content.cloneNode(true);
  result.querySelector('#result-village').textContent = village.name;
  result.querySelector('.reference-room').textContent = village.room;
  const days = result.querySelector('.room-days');
  let currentDay;
  let list;

  for (const session of village.sessions) {
    if (session.day !== currentDay) {
      currentDay = session.day;
      days.append(element('h3', 'room-day', currentDay));
      list = element('ul', 'room-sessions', '');
      days.append(list);
    }
    const row = element('li', 'room-session', '');
    const details = element('div', 'room-details', '');
    details.append(element('h4', 'room-workshop', session.title));
    const change = session.room !== village.room;
    const room = element('p', change ? 'session-room changed-room' : 'session-room',
      change ? 'Changement de salle · ' + session.room : session.room);
    details.append(room);
    if (session.sharedWith) {
      details.append(element('p', 'shared-workshop', 'Atelier partagé avec ' + session.sharedWith));
    }
    row.append(element('span', 'session-time', session.time), details);
    list.append(row);
  }

  answer.replaceChildren(result);
  status.textContent = village.name + ' · Salle de référence ' + village.room + ' · 8 ateliers trouvés.';
}

function villageButtons(matches) {
  return matches.map(village => {
    const button = element('button', '', village.name);
    button.type = 'button';
    button.addEventListener('click', () => {
      picker.querySelector('summary').focus();
      showVillage(village);
    });
    return button;
  });
}

function showChoices(matches, message) {
  const group = element('div', 'room-choices', '');
  group.append(...villageButtons(matches));
  answer.replaceChildren(element('p', 'chat-bubble', message), group);
  status.textContent = message;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const query = normalize(input.value);
  const exact = directory.find(entry => entry.keys.includes(query));
  if (exact) {
    showVillage(exact.village);
    return;
  }
  const matches = query.length > 1
    ? directory.filter(entry => entry.keys.some(key => key.includes(query))).map(entry => entry.village)
    : [];
  if (matches.length === 1) {
    showVillage(matches[0]);
  } else if (matches.length > 1) {
    showChoices(matches, 'Plusieurs villages correspondent. Choisissez le vôtre.');
  } else {
    showChoices(villages, 'Village introuvable. Vérifiez le nom ou choisissez dans la liste.');
  }
});
