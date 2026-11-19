/**
 * The app's account services, set once in main.js and read by views that need them (the workspace
 * pushes Accepted solutions to GitHub). Null until main.js wires them, and in tests.
 * @type {{ account: any, github: ReturnType<import('./github-sync.js').createGitHubSync>|null }}
 */
export const services = { account: null, github: null };
