// O(1): the losing sizes are the multiples of 4. From any other size, taking n % 4 stones
// hands the opponent a multiple of 4, and from a multiple of 4 every move leaves a non-multiple.
bool canWinStones(int n) {
    return n % 4 != 0;
}
