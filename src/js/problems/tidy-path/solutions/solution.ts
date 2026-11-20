// O(n) time, O(n) space: a stack holds the directory names of the path read so far.
function tidyPath(path: string): string {
  const stack: string[] = [];
  for (const part of path.split('/')) {
    // Empty pieces come from repeated slashes and "." stays where it is.
    if (part === '' || part === '.') continue;
    if (part === '..') {
      // At the root there is nothing to go up to, so ".." is ignored (pop on empty is a no-op).
      stack.pop();
    } else {
      // Only the exact pieces "." and ".." are special: "..." is an ordinary name.
      stack.push(part);
    }
  }
  return '/' + stack.join('/');
}
