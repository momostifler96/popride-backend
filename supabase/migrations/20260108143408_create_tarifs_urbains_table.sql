/*
  # Create tarifs_urbains table

  1. New Tables
    - `tarifs_urbains`
      - `id` (uuid, primary key)
      - `ligne_id` (uuid, foreign key) - Ligne urbaine concernée
      - `arret_depart_id` (uuid, foreign key) - Arrêt de départ
      - `arret_arrivee_id` (uuid, foreign key) - Arrêt d'arrivée
      - `prix_eco` (decimal, not null) - Prix pour catégorie ECO
      - `prix_confort` (decimal, not null) - Prix pour catégorie CONFORT
      - `prix_confort_plus` (decimal, not null) - Prix pour catégorie CONFORT+
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Constraints
    - Unique constraint on (ligne_id, arret_depart_id, arret_arrivee_id)
    - Check constraint: arret_depart_id != arret_arrivee_id
    - Check constraint: all prices >= 0

  3. Security
    - Enable RLS on `tarifs_urbains` table
    - Add policy for authenticated users to read tarifs
    - Add policy for authenticated users to insert/update/delete tarifs

  4. Notes
    - Prix fixes définis uniquement par l'admin
    - Aucun prix dynamique
    - Un tarif par trajet (départ-arrivée) sur une ligne donnée
*/

CREATE TABLE IF NOT EXISTS tarifs_urbains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ligne_id uuid NOT NULL REFERENCES lignes_urbaines(id) ON DELETE CASCADE,
  arret_depart_id uuid NOT NULL REFERENCES arrets_urbains(id) ON DELETE CASCADE,
  arret_arrivee_id uuid NOT NULL REFERENCES arrets_urbains(id) ON DELETE CASCADE,
  prix_eco decimal(10,2) NOT NULL CHECK (prix_eco >= 0),
  prix_confort decimal(10,2) NOT NULL CHECK (prix_confort >= 0),
  prix_confort_plus decimal(10,2) NOT NULL CHECK (prix_confort_plus >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_arrets CHECK (arret_depart_id != arret_arrivee_id),
  CONSTRAINT unique_trajet UNIQUE (ligne_id, arret_depart_id, arret_arrivee_id)
);

CREATE INDEX IF NOT EXISTS idx_tarifs_ligne ON tarifs_urbains(ligne_id);
CREATE INDEX IF NOT EXISTS idx_tarifs_depart ON tarifs_urbains(arret_depart_id);
CREATE INDEX IF NOT EXISTS idx_tarifs_arrivee ON tarifs_urbains(arret_arrivee_id);

ALTER TABLE tarifs_urbains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tarifs"
  ON tarifs_urbains
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tarifs"
  ON tarifs_urbains
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tarifs"
  ON tarifs_urbains
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tarifs"
  ON tarifs_urbains
  FOR DELETE
  TO authenticated
  USING (true);
