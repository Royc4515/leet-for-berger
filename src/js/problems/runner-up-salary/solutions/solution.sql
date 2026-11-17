-- The outer SELECT always yields one row: when the scalar subquery finds no second distinct
-- salary it evaluates to NULL instead of returning zero rows.
SELECT (
  SELECT DISTINCT salary
  FROM Employee
  ORDER BY salary DESC
  LIMIT 1 OFFSET 1
) AS SecondHighestSalary;
