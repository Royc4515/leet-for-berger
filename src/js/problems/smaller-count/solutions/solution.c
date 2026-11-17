// O(n + 101) time - values are 0..100, so count them instead of comparing pairs.
int* smallerNumbersThanCurrent(int* nums, int numsSize, int* returnSize) {
    int freq[101] = {0};
    for (int i = 0; i < numsSize; i++) freq[nums[i]]++;
    // smaller[v] = how many elements are below v: a running total of the counts before v.
    int smaller[101] = {0};
    for (int v = 1; v <= 100; v++) smaller[v] = smaller[v - 1] + freq[v - 1];
    int* answer = malloc(sizeof(int) * numsSize);
    for (int i = 0; i < numsSize; i++) answer[i] = smaller[nums[i]];
    *returnSize = numsSize;
    return answer;
}
