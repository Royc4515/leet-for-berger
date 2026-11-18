/**
 * Optional Cloudflare Turnstile tokens for the remote runner (docs/adr/0005-remote-runner.md).
 * Used only when a site key is configured (src/js/config.js); otherwise nothing here loads.
 * Touches the DOM only when a token is requested, never at import.
 */

// Cloudflare serves Turnstile only from this URL and offers no pinned builds (unlike Monaco or
// Pyodide, invariant 8 cannot apply); it loads only when a site key is configured.
const SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading = null;

function loadScript() {
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => {
      loading = null;
      reject(new Error('Turnstile could not load.'));
    };
    document.head.append(s);
  });
  return loading;
}

/**
 * A function that returns a fresh single-use token per call (an invisible widget, rendered and
 * removed each time). Resolves to null when Turnstile cannot load, so the Worker decides.
 * @param {string} siteKey public site key
 * @returns {() => Promise<string|null>}
 */
export function turnstileTokenProvider(siteKey) {
  return async () => {
    let ts;
    try {
      ts = await loadScript();
    } catch {
      return null;
    }
    return new Promise((resolve) => {
      const host = document.createElement('div');
      host.className = 'turnstile-host';
      document.body.append(host);
      let id = null;
      const done = (token) => {
        if (id !== null) ts.remove(id);
        host.remove();
        resolve(token);
      };
      id = ts.render(host, { sitekey: siteKey, callback: (t) => done(t), 'error-callback': () => done(null), 'timeout-callback': () => done(null) });
    });
  };
}
