-- Both flags must be 'Y': AND, not OR. No DISTINCT needed, product_id is the primary key.
SELECT product_id
FROM Products
WHERE low_fats = 'Y' AND recyclable = 'Y';
