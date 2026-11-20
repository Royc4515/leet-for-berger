def crack_palindrome(palindrome: str) -> str:
    # O(n) time. Lower the earliest letter that is not 'a'; if the whole first half is 'a', raise
    # the last letter to 'b' instead.
    n = len(palindrome)
    if n < 2:
        return ""
    # Only the first half: the middle of an odd palindrome mirrors itself, so lowering it keeps the
    # string a palindrome ("aba" -> "aaa").
    for i in range(n // 2):
        if palindrome[i] != "a":
            return palindrome[:i] + "a" + palindrome[i + 1:]
    return palindrome[:-1] + "b"
