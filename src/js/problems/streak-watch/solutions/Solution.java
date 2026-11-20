// O(1) per call: one counter holds the length of the current run of target readings.
class StreakWatch {
    private final int target;
    private final int k;
    private int run;

    public StreakWatch(int target, int k) {
        this.target = target;
        this.k = k;
    }

    public boolean observe(int reading) {
        // Any other value breaks the run; the last k readings are all the target exactly when the
        // run is at least k long (a longer run keeps answering true).
        run = reading == target ? run + 1 : 0;
        return run >= k;
    }
}
