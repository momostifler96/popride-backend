/*
  # Create categories_vehicules table

  1. New Tables
    - `categories_vehicules`
      - `id` (uuid, primary key)
      - `nom` (text, unique, not null) - Nom de la catégorie (ECO, CONFORT, CONFORT+)
      - `capacite` (integer, not null) - Nombre de passagers
      - `description` (text) - Description de la catégorie
      - `prix_base` (decimal) - Prix de base par km
      - `statut` (text, not null) - Statut: active, inactive
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `categories_vehicules` table
    - Add policy for authenticated users to read categories
    - Add policy for authenticated users to update categories (not delete)

  3. Data
    - Insert default categories: ECO, CONFORT, CONFORT+
*/

CREATE TABLE IF NOT EXISTS categories_vehicules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text UNIQUE NOT NULL,
  capacite integer NOT NULL DEFAULT 4,
  description text,
  prix_base decimal(10,2),
  statut text NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE categories_vehicules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view categories"
  ON categories_vehicules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories_vehicules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

INSERT INTO categories_vehicules (nom, capacite, description, prix_base, statut)
VALUES 
  ('ECO', 4, 'Véhicule économique pour déplacements standards', 0.50, 'active'),
  ('CONFORT', 4, 'Véhicule confortable avec équipements premium', 0.75, 'active'),
  ('CONFORT+', 6, 'Véhicule haut de gamme avec espace élargi', 1.00, 'active')
ON CONFLICT (nom) DO NOTHING;
