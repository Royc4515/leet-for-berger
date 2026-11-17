-- LEFT JOIN keeps every person; a person without an address gets NULL city and state.
SELECT p.firstName, p.lastName, a.city, a.state
FROM Person AS p
LEFT JOIN Address AS a ON a.personId = p.personId;
