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
  profile: village,
  keys: [village.name, ...(aliases[village.name] ?? [])].map(normalize),
})).concat(speakers.map(speaker => ({
  profile: speaker,
  keys: [speaker.name, ...speaker.aliases, ...[speaker.name, ...speaker.aliases].map(name => {
    const words = name.split(/\s+/);
    return [words.at(-1), ...words.slice(0, -1)].join(' ');
  })].map(normalize),
})), filieres.map(profile => ({
  profile,
  keys: [profile.name].map(normalize),
})));

const picker = document.querySelector('.village-picker');
const speakerPicker = document.querySelector('.speaker-picker');
const filierePicker = document.querySelector('.filiere-picker');
const sortedSpeakers = [...speakers].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
options.append(...choiceButtons(villages, picker));
document.querySelector('#filiere-list').append(...choiceButtons(filieres, filierePicker));
document.querySelector('#speaker-list').append(...choiceButtons(sortedSpeakers, speakerPicker));

input.addEventListener('focus', () => { picker.open = true; });

function element(tag, className, content) {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = content;
  return node;
}

function showProfile(profile) {
  input.value = profile.name;
  picker.open = false;
  speakerPicker.open = false;
  filierePicker.open = false;
  const result = resultTemplate.content.cloneNode(true);
  result.querySelector('#result-village').textContent = profile.name;
  const reference = result.querySelector('.room-reference');
  if (profile.room) reference.querySelector('.reference-room').textContent = profile.room;
  else reference.hidden = true;
  const days = result.querySelector('.room-days');
  let currentDay;
  let list;

  for (const session of profile.sessions) {
    if (session.day !== currentDay) {
      currentDay = session.day;
      days.append(element('h3', 'room-day', currentDay));
      list = element('ul', 'room-sessions', '');
      days.append(list);
    }
    const row = element('li', 'room-session', '');
    const details = element('div', 'room-details', '');
    details.append(element('h4', 'room-workshop', session.title));
    const change = profile.room && session.room !== profile.room;
    const room = element('p', change ? 'session-room changed-room' : 'session-room',
      change ? 'Changement de salle · ' + session.room : session.room);
    details.append(room);
    if (session.sharedWith) {
      details.append(element('p', 'shared-workshop', 'Atelier partagé avec ' + session.sharedWith));
    }
    if (session.audience) details.append(element('p', 'shared-workshop', session.audience));
    if (session.note) details.append(element('p', 'session-note', session.note));
    row.append(element('span', 'session-time', session.time), details);
    list.append(row);
  }

  if (!profile.sessions.length) {
    days.append(element('p', 'session-note', 'Aucun créneau nominatif renseigné dans le planning.'));
  }
  answer.replaceChildren(result);
  status.textContent = profile.name + ' · ' + (
    profile.sessions.length ? profile.sessions.length + ' créneau(x) trouvé(s).' : 'Aucun créneau nominatif renseigné.'
  );
}

function choiceButtons(matches, disclosure = picker) {
  return matches.map(profile => {
    const button = element('button', '', profile.name);
    button.type = 'button';
    button.addEventListener('click', () => {
      disclosure.querySelector('summary').focus();
      showProfile(profile);
    });
    return button;
  });
}

function showChoices(matches, message) {
  const group = element('div', 'room-choices', '');
  group.append(...choiceButtons(matches));
  answer.replaceChildren(element('p', 'chat-bubble', message), group);
  status.textContent = message;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const query = normalize(input.value.replace(/^\s*(?:je suis (?:un|une)\s+|fili[eè]re\s+)/i, ''));
  const exact = directory.find(entry => entry.keys.includes(query));
  if (exact) {
    showProfile(exact.profile);
    return;
  }
  const matches = query.length > 1
    ? directory.filter(entry => entry.keys.some(key => key.includes(query))).map(entry => entry.profile)
    : [];
  if (matches.length === 1) {
    showProfile(matches[0]);
  } else if (matches.length > 1) {
    showChoices(matches, 'Plusieurs résultats correspondent. Choisissez dans la liste.');
  } else {
    showChoices([...villages, ...filieres], 'Aucun résultat. Vérifiez votre recherche ou choisissez un village ou une filière.');
  }
});
