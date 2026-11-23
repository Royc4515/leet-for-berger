/**
 * AI Mentor side panel (chat UI). Provider is swappable; see src/js/mentor/mentor.js.
 */
import { h } from './dom.js';
import { ScriptedMentor } from '../mentor/mentor.js';

const provider = new ScriptedMentor();

/**
 * @param {{ getContext: () => object, onClose: () => void, onHelp?: () => void }} opts
 *   onHelp: replays the mentor's guided tour (data/tours.js); no button without it
 */
export function createMentorPanel({ getContext, onClose, onHelp }) {
  const log = h('div.mentor-log', { role: 'log', 'aria-live': 'polite' });
  const input = h('textarea.mentor-input', { rows: 2, placeholder: 'Where are you stuck? (Enter to send)', 'aria-label': 'Message the mentor' });
  const send = h('button.btn.btn-primary.btn-sm', { type: 'button' }, 'Send');

  const add = (who, text) => {
    log.append(h(`div.msg.msg-${who}`, {}, h('div.msg-who', {}, who === 'user' ? 'You' : 'Mentor'), h('div.msg-text', {}, text)));
    log.scrollTop = log.scrollHeight;
  };
  add('mentor', "I ask questions, I don't hand out answers. Tell me what you tried, or ask for a hint.");

  async function submit() {
    const message = input.value.trim();
    if (!message) return;
    input.value = '';
    add('user', message);
    send.disabled = true;
    try {
      const reply = await provider.reply({ message, ...getContext() });
      add('mentor', reply);
    } catch (err) {
      add('mentor', `Mentor unavailable: ${err.message}`);
    } finally {
      send.disabled = false;
      input.focus();
    }
  }
  send.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  });

  const el = h(
    'aside.mentor',
    { 'aria-label': 'AI Mentor' },
    h(
      'div.mentor-head',
      {},
      h('div', {}, h('strong', {}, 'AI Mentor'), h('span.tag.tag-muted', {}, 'Socratic · offline')),
      h(
        'div.mentor-head-actions',
        {},
        onHelp ? h('button.btn.btn-ghost.btn-icon', { type: 'button', 'aria-label': 'How the mentor works', 'aria-haspopup': 'dialog', title: 'How the mentor works', onClick: onHelp }, '?') : null,
        h('button.btn.btn-ghost.btn-icon', { type: 'button', 'aria-label': 'Close mentor', onClick: onClose }, '×'),
      ),
    ),
    log,
    h('div.mentor-compose', {}, input, send),
  );
  return { el, focus: () => input.focus() };
}
