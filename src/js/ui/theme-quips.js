/**
 * Answers a theme switch with a line (owner's request; the lines and rules are in
 * data/theme-quips.js). Listens for `theme:chosen`, which fires only for a choice the user makes
 * (theme-boot.js for the site, ui/theme.js for the editor), so a device going dark on "System" or
 * another tab says nothing. Silent inside a session (interview, mock OA, battle): no jokes on the clock.
 * Loaded by main.js after the first page, like the reminders bell, so it is not a startup module.
 */
import { toast } from './dom.js';
import { themeQuip } from '../data/theme-quips.js';

let installed = false;

/**
 * Starts answering theme switches. Idempotent.
 * @returns {void}
 */
export function installThemeQuips() {
  if (installed) return;
  installed = true;
  let last = '';
  let quiet = false;
  let shown = null;
  addEventListener('theme:chosen', (e) => {
    // "Back to dark" already made its point; the switch it makes needs no second line.
    if (quiet) return void (quiet = false);
    if (document.body.classList.contains('lockdown')) return;
    const quip = themeQuip(e.detail, Math.random, last);
    if (!quip) return;
    last = quip.text;
    const undo = quip.undo;
    const action = undo
      ? {
          label: undo.label,
          onClick: () => {
            quiet = true;
            globalThis.lfbTheme?.set(undo.value);
          },
        }
      : null;
    // One line at a time: the next switch replaces it, so a stale "Back to dark" never lingers.
    shown?.remove();
    // A line with a way back stays long enough to reach the button.
    shown = toast(quip.text, 'info', undo ? 6000 : 4200, action);
  });
}
