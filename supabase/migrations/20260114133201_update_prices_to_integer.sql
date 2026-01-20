/*
  # Update all price columns to INTEGER

  1. Changes
    - Convert all decimal price columns to INTEGER
    - Remove decimal places as prices are now stored as whole numbers in CFA

  2. Tables Updated
    - tarifs_urbains: prix_eco, prix_confort, prix_confort_plus
    - courses_urbaines: prix
    - trajets_interurbains: prix_par_place
    - reservations_interurbaines: prix_total

  3. Notes
    - All prices are now stored as INTEGER values (no decimals)
    - Display format is handled in the application layer
    - Existing decimal values are rounded to nearest integer
*/

-- Update tarifs_urbains
ALTER TABLE tarifs_urbains
  ALTER COLUMN prix_eco TYPE integer USING ROUND(prix_eco)::integer,
  ALTER COLUMN prix_confort TYPE integer USING ROUND(prix_confort)::integer,
  ALTER COLUMN prix_confort_plus TYPE integer USING ROUND(prix_confort_plus)::integer;

-- Update courses_urbaines
ALTER TABLE courses_urbaines
  ALTER COLUMN prix TYPE integer USING ROUND(prix)::integer;

-- Update trajets_interurbains
ALTER TABLE trajets_interurbains
  ALTER COLUMN prix_par_place TYPE integer USING ROUND(prix_par_place)::integer;

-- Update reservations_interurbaines
ALTER TABLE reservations_interurbaines
  ALTER COLUMN prix_total TYPE integer USING ROUND(prix_total)::integer;
