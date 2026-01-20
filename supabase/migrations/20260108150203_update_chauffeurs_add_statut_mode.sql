/*
  # Update chauffeurs table - Add statut and mode

  1. Changes
    - Add `statut` column (actif, suspendu, inactif)
    - Add `mode` column (urbain, interurbain, mixte)
    - Add indexes for filtering

  2. Notes
    - Statut par défaut: actif
    - Mode par défaut: urbain
    - Permet aux admins de superviser et suspendre les chauffeurs
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chauffeurs' AND column_name = 'statut'
  ) THEN
    ALTER TABLE chauffeurs 
    ADD COLUMN statut text NOT NULL DEFAULT 'actif' 
    CHECK (statut IN ('actif', 'suspendu', 'inactif'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chauffeurs' AND column_name = 'mode'
  ) THEN
    ALTER TABLE chauffeurs 
    ADD COLUMN mode text NOT NULL DEFAULT 'urbain' 
    CHECK (mode IN ('urbain', 'interurbain', 'mixte'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chauffeurs_statut ON chauffeurs(statut);
CREATE INDEX IF NOT EXISTS idx_chauffeurs_mode ON chauffeurs(mode);
