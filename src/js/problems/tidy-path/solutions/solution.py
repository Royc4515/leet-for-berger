def tidy_path(path: str) -> str:
    # O(n) time, O(n) space: a stack holds the directory names of the path read so far.
    stack = []
    for part in path.split('/'):
        # Empty pieces come from repeated slashes and "." stays where it is.
        if part == '' or part == '.':
            continue
        if part == '..':
            # At the root there is nothing to go up to, so ".." is ignored.
            if stack:
                stack.pop()
        else:
            # Only the exact pieces "." and ".." are special: "..." is an ordinary name.
            stack.append(part)
    return '/' + '/'.join(stack)
