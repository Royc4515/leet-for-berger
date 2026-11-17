-- Join each row to the next two ids: a match on all three is a run of three. Joining on id
-- (the primary key) rather than trusting row order makes it correct for any storage order.
-- DISTINCT because a longer run, or a second run, matches more than once.
SELECT DISTINCT l1.num AS ConsecutiveNums
FROM Logs AS l1
JOIN Logs AS l2 ON l2.id = l1.id + 1 AND l2.num = l1.num
JOIN Logs AS l3 ON l3.id = l1.id + 2 AND l3.num = l1.num;
