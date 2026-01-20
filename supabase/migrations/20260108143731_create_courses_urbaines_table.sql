/*
  # Create courses_urbaines table

  1. New Tables
    - `courses_urbaines`
      - `id` (uuid, primary key)
      - `ligne_id` (uuid, foreign key) - Ligne urbaine
      - `arret_depart_id` (uuid, foreign key) - Arrêt de départ
      - `arret_arrivee_id` (uuid, foreign key) - Arrêt d'arrivée
      - `chauffeur_id` (uuid, foreign key) - Chauffeur assigné
      - `categorie_id` (uuid, foreign key) - Catégorie du véhicule
      - `client_nom` (text) - Nom du client
      - `client_telephone` (text) - Téléphone du client
      - `prix` (decimal) - Prix de la course
      - `statut` (text) - Statut de la course
      - `date_course` (date) - Date de la course
      - `heure_depart` (time) - Heure de départ prévue
      - `heure_prise_en_charge` (timestamptz) - Heure réelle de prise en charge
      - `heure_arrivee` (timestamptz) - Heure réelle d'arrivée
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Constraints
    - Check constraint: arret_depart_id != arret_arrivee_id
    - Check constraint: prix >= 0
    - Check constraint: statut valides

  3. Security
    - Enable RLS on `courses_urbaines` table
    - Add policy for authenticated users to manage courses

  4. Notes
    - Statuts possibles: en_attente, en_cours, terminee, annulee
    - Permet la supervision en temps réel des courses urbaines
*/

CREATE TABLE IF NOT EXISTS courses_urbaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ligne_id uuid NOT NULL REFERENCES lignes_urbaines(id) ON DELETE RESTRICT,
  arret_depart_id uuid NOT NULL REFERENCES arrets_urbains(id) ON DELETE RESTRICT,
  arret_arrivee_id uuid NOT NULL REFERENCES arrets_urbains(id) ON DELETE RESTRICT,
  chauffeur_id uuid REFERENCES chauffeurs(id) ON DELETE SET NULL,
  categorie_id uuid NOT NULL REFERENCES categories_vehicules(id) ON DELETE RESTRICT,
  client_nom text NOT NULL,
  client_telephone text NOT NULL,
  prix decimal(10,2) NOT NULL CHECK (prix >= 0),
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'en_cours', 'terminee', 'annulee')),
  date_course date NOT NULL DEFAULT CURRENT_DATE,
  heure_depart time,
  heure_prise_en_charge timestamptz,
  heure_arrivee timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_arrets_courses CHECK (arret_depart_id != arret_arrivee_id)
);

CREATE INDEX IF NOT EXISTS idx_courses_urbaines_ligne ON courses_urbaines(ligne_id);
CREATE INDEX IF NOT EXISTS idx_courses_urbaines_chauffeur ON courses_urbaines(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_courses_urbaines_statut ON courses_urbaines(statut);
CREATE INDEX IF NOT EXISTS idx_courses_urbaines_date ON courses_urbaines(date_course);
CREATE INDEX IF NOT EXISTS idx_courses_urbaines_categorie ON courses_urbaines(categorie_id);

ALTER TABLE courses_urbaines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view courses"
  ON courses_urbaines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert courses"
  ON courses_urbaines
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update courses"
  ON courses_urbaines
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete courses"
  ON courses_urbaines
  FOR DELETE
  TO authenticated
  USING (true);
