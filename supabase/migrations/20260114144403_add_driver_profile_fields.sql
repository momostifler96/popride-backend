/*
  # Add Driver Profile and Vehicle Information Fields

  1. New Columns to chauffeurs table
    - `photo_profil_url` (text) - URL to driver's profile photo
    - `date_naissance` (date) - Driver's date of birth
    - `ville` (text) - Driver's city/address
    - `numero_identite` (text) - National ID number
    - `photo_vehicule_url` (text) - URL to vehicle photo
    - `vehicule_marque` (text) - Vehicle brand
    - `vehicule_annee` (integer) - Vehicle year
    - `vehicule_couleur` (text) - Vehicle color
    - `plaque_immatriculation` (text) - License plate number
    - `nombre_places` (integer) - Available seats in vehicle

  2. Updates
    - Make some existing fields more appropriate for registration
*/

-- Add new profile fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'photo_profil_url'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN photo_profil_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'date_naissance'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN date_naissance date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'ville'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN ville text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'numero_identite'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN numero_identite text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'photo_vehicule_url'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN photo_vehicule_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'vehicule_marque'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN vehicule_marque text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'vehicule_annee'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN vehicule_annee integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'vehicule_couleur'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN vehicule_couleur text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'plaque_immatriculation'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN plaque_immatriculation text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chauffeurs' AND column_name = 'nombre_places'
  ) THEN
    ALTER TABLE chauffeurs ADD COLUMN nombre_places integer DEFAULT 4 CHECK (nombre_places >= 1 AND nombre_places <= 8);
  END IF;
END $$;
