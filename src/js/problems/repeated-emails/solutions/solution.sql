-- Group equal emails; HAVING filters on the group size, which WHERE cannot see.
-- Each group yields one row, so an email on three rows is reported once.
SELECT email AS Email
FROM Person
GROUP BY email
HAVING COUNT(*) > 1;
