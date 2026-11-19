-- Read Employee twice: e is the employee, m the manager found through e.managerId. The inner join
-- drops anyone with no known manager; the strict > leaves out ties.
SELECT e.name AS employee
FROM Employee AS e
JOIN Employee AS m ON m.id = e.managerId
WHERE e.salary > m.salary;
