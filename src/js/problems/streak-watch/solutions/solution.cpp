// O(1) per call: one counter holds the length of the current run of target readings.
class StreakWatch {
private:
    int target;
    int k;
    int run;

public:
    StreakWatch(int target, int k)
        : target(target)
        , k(k)
        , run(0) {}

    bool observe(int reading) {
        // Any other value breaks the run; the last k readings are all the target exactly when the
        // run is at least k long (a longer run keeps answering true).
        run = reading == target ? run + 1 : 0;
        return run >= k;
    }
};
