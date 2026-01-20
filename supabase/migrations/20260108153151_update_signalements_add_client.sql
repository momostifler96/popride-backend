/*
  # Update signalements table to support client signalements

  1. Changes
    - Update type_entite check constraint to include 'client'

  2. Notes
    - Allows signalements against clients
*/

DO $$
BEGIN
  ALTER TABLE signalements DROP CONSTRAINT IF EXISTS signalements_type_entite_check;
  
  ALTER TABLE signalements 
  ADD CONSTRAINT signalements_type_entite_check 
  CHECK (type_entite IN ('chauffeur', 'trajet', 'course', 'client'));
END $$;
