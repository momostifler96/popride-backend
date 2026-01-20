/*
  # Add categorie_id to chauffeurs table

  1. Changes
    - Add `categorie_id` column to `chauffeurs` table
    - Add foreign key constraint to `categories_vehicules`
    - Add index for better query performance

  2. Notes
    - A chauffeur belongs to a single category
    - Category is optional (nullable) for now to allow existing chauffeurs
*/

-- Check if chauffeurs table exists and add column if it doesn't have it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chauffeurs') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'chauffeurs' AND column_name = 'categorie_id'
    ) THEN
      ALTER TABLE chauffeurs ADD COLUMN categorie_id uuid REFERENCES categories_vehicules(id);
      CREATE INDEX IF NOT EXISTS idx_chauffeurs_categorie ON chauffeurs(categorie_id);
    END IF;
  END IF;
END $$;
