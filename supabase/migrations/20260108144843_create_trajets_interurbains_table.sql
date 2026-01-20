/*
  # Create trajets_interurbains table

  1. New Tables
    - `trajets_interurbains`
      - `id` (uuid, primary key)
      - `chauffeur_id` (uuid, foreign key) - Chauffeur qui propose le trajet
      - `ville_depart` (text) - Ville de départ
      - `ville_arrivee` (text) - Ville d'arrivée
      - `date_depart` (date) - Date du trajet
      - `heure_depart` (time) - Heure de départ
      - `places_disponibles` (integer) - Nombre de places offertes
      - `places_reservees` (integer) - Nombre de places réservées
      - `prix_par_place` (decimal) - Prix par personne
      - `statut` (text) - Statut du trajet (actif, suspendu, termine, annule)
      - `description` (text) - Description optionnelle
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Constraints
    - Check constraint: places_disponibles > 0
    - Check constraint: places_reservees >= 0
    - Check constraint: places_reservees <= places_disponibles
    - Check constraint: prix_par_place >= 0
    - Check constraint: statut valides

  3. Security
    - Enable RLS on `trajets_interurbains` table
    - Add policies for authenticated users

  4. Notes
    - Les trajets sont créés par les chauffeurs (pas par les admins)
    - Les admins peuvent superviser, suspendre et supprimer
    - Statuts: actif, suspendu, termine, annule
*/

CREATE TABLE IF NOT EXISTS trajets_interurbains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id uuid NOT NULL REFERENCES chauffeurs(id) ON DELETE CASCADE,
  ville_depart text NOT NULL,
  ville_arrivee text NOT NULL,
  date_depart date NOT NULL,
  heure_depart time NOT NULL,
  places_disponibles integer NOT NULL CHECK (places_disponibles > 0),
  places_reservees integer NOT NULL DEFAULT 0 CHECK (places_reservees >= 0),
  prix_par_place decimal(10,2) NOT NULL CHECK (prix_par_place >= 0),
  statut text NOT NULL DEFAULT 'actif' CHECK (statut IN ('actif', 'suspendu', 'termine', 'annule')),
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_places CHECK (places_reservees <= places_disponibles)
);

CREATE INDEX IF NOT EXISTS idx_trajets_interurbains_chauffeur ON trajets_interurbains(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_trajets_interurbains_statut ON trajets_interurbains(statut);
CREATE INDEX IF NOT EXISTS idx_trajets_interurbains_date ON trajets_interurbains(date_depart);
CREATE INDEX IF NOT EXISTS idx_trajets_interurbains_villes ON trajets_interurbains(ville_depart, ville_arrivee);

ALTER TABLE trajets_interurbains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view trajets"
  ON trajets_interurbains
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Chauffeurs can insert their own trajets"
  ON trajets_interurbains
  FOR INSERT
  TO authenticated
  WITH CHECK (chauffeur_id IN (SELECT id FROM chauffeurs WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can update trajets"
  ON trajets_interurbains
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete trajets"
  ON trajets_interurbains
  FOR DELETE
  TO authenticated
  USING (true);
