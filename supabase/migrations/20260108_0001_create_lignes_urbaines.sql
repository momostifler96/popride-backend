-- Création de la table lignes_urbaines

CREATE TABLE IF NOT EXISTS lignes_urbaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);
