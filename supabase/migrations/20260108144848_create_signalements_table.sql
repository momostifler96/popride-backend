/*
  # Create signalements table

  1. New Tables
    - `signalements`
      - `id` (uuid, primary key)
      - `type_entite` (text) - Type d'entité signalée (chauffeur, trajet, course)
      - `entite_id` (uuid) - ID de l'entité signalée
      - `auteur_nom` (text) - Nom du signalant
      - `auteur_telephone` (text) - Téléphone du signalant
      - `motif` (text) - Motif du signalement
      - `description` (text) - Description détaillée
      - `statut` (text) - Statut (nouveau, en_cours, traite, rejete)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `traite_par` (uuid, foreign key) - Admin qui a traité
      - `note_traitement` (text) - Note de traitement

  2. Constraints
    - Check constraint: type_entite valides
    - Check constraint: statut valides

  3. Security
    - Enable RLS on `signalements` table
    - Add policies for authenticated users

  4. Notes
    - Permet le signalement de comportements inappropriés
    - Utilisé pour la supervision par les admins
*/

CREATE TABLE IF NOT EXISTS signalements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_entite text NOT NULL CHECK (type_entite IN ('chauffeur', 'trajet', 'course')),
  entite_id uuid NOT NULL,
  auteur_nom text NOT NULL,
  auteur_telephone text NOT NULL,
  motif text NOT NULL,
  description text,
  statut text NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'traite', 'rejete')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  traite_par uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  note_traitement text
);

CREATE INDEX IF NOT EXISTS idx_signalements_type_entite ON signalements(type_entite, entite_id);
CREATE INDEX IF NOT EXISTS idx_signalements_statut ON signalements(statut);
CREATE INDEX IF NOT EXISTS idx_signalements_created ON signalements(created_at);

ALTER TABLE signalements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view signalements"
  ON signalements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert signalements"
  ON signalements
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update signalements"
  ON signalements
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete signalements"
  ON signalements
  FOR DELETE
  TO authenticated
  USING (true);
