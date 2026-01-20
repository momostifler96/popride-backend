/*
  # Mise à jour du schéma des lignes urbaines

  1. Modifications
    - Ajout de colonnes manquantes à `lignes_urbaines`
      - `numero` (text) - Numéro de la ligne
      - `description` (text) - Description de la ligne
      - `statut` (text) - brouillon, active, inactive
      - `couleur` (text) - Couleur de la ligne
      - `prix` (decimal) - Prix de base
      - `updated_at` (timestamptz)
    
    - Ajout de `created_at` à `arrets_urbains` si manquant

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour authentifiés seulement
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lignes_urbaines' AND column_name = 'numero'
  ) THEN
    ALTER TABLE lignes_urbaines ADD COLUMN numero text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lignes_urbaines' AND column_name = 'description'
  ) THEN
    ALTER TABLE lignes_urbaines ADD COLUMN description text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lignes_urbaines' AND column_name = 'statut'
  ) THEN
    ALTER TABLE lignes_urbaines ADD COLUMN statut text DEFAULT 'brouillon';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lignes_urbaines' AND column_name = 'couleur'
  ) THEN
    ALTER TABLE lignes_urbaines ADD COLUMN couleur text DEFAULT '#3B82F6';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lignes_urbaines' AND column_name = 'prix'
  ) THEN
    ALTER TABLE lignes_urbaines ADD COLUMN prix decimal(10,2) DEFAULT 0.00;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lignes_urbaines' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE lignes_urbaines ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'arrets_urbains' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE arrets_urbains ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lignes_urbaines_statut_check'
  ) THEN
    ALTER TABLE lignes_urbaines ADD CONSTRAINT lignes_urbaines_statut_check 
    CHECK (statut IN ('brouillon', 'active', 'inactive'));
  END IF;
END $$;

ALTER TABLE lignes_urbaines ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrets_urbains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view lignes urbaines" ON lignes_urbaines;
CREATE POLICY "Authenticated users can view lignes urbaines"
  ON lignes_urbaines FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert lignes urbaines" ON lignes_urbaines;
CREATE POLICY "Authenticated users can insert lignes urbaines"
  ON lignes_urbaines FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update lignes urbaines" ON lignes_urbaines;
CREATE POLICY "Authenticated users can update lignes urbaines"
  ON lignes_urbaines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete lignes urbaines" ON lignes_urbaines;
CREATE POLICY "Authenticated users can delete lignes urbaines"
  ON lignes_urbaines FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can view arrets" ON arrets_urbains;
CREATE POLICY "Authenticated users can view arrets"
  ON arrets_urbains FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert arrets" ON arrets_urbains;
CREATE POLICY "Authenticated users can insert arrets"
  ON arrets_urbains FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update arrets" ON arrets_urbains;
CREATE POLICY "Authenticated users can update arrets"
  ON arrets_urbains FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete arrets" ON arrets_urbains;
CREATE POLICY "Authenticated users can delete arrets"
  ON arrets_urbains FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_arrets_urbains_ligne_id ON arrets_urbains(ligne_id);
CREATE INDEX IF NOT EXISTS idx_arrets_urbains_ordre ON arrets_urbains(ordre);
CREATE INDEX IF NOT EXISTS idx_lignes_urbaines_statut ON lignes_urbaines(statut);