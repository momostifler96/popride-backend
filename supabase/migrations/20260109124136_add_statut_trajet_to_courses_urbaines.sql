/*
  # Add statut_trajet to courses_urbaines table

  1. Changes
    - Add `statut_trajet` column to track detailed driver status
      - Values: 'en_route', 'arrive_depart', 'en_trajet', 'arrive_destination'
      - en_route: Driver is on the way to pickup location
      - arrive_depart: Driver has arrived at departure stop
      - en_trajet: Passenger picked up, going to destination
      - arrive_destination: Arrived at destination stop
    
    - Add `heure_depart_chauffeur` timestamp for when driver starts heading to pickup
    - Add `heure_arrivee_depart` timestamp for when driver arrives at pickup stop
    - Add `eta_minutes` for estimated time of arrival

  2. Notes
    - This provides more granular tracking of the ride progress
    - Helps clients know exactly where the driver is
    - Enables better notifications and status updates
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses_urbaines' AND column_name = 'statut_trajet'
  ) THEN
    ALTER TABLE courses_urbaines 
    ADD COLUMN statut_trajet text CHECK (statut_trajet IN ('en_route', 'arrive_depart', 'en_trajet', 'arrive_destination'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses_urbaines' AND column_name = 'heure_depart_chauffeur'
  ) THEN
    ALTER TABLE courses_urbaines 
    ADD COLUMN heure_depart_chauffeur timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses_urbaines' AND column_name = 'heure_arrivee_depart'
  ) THEN
    ALTER TABLE courses_urbaines 
    ADD COLUMN heure_arrivee_depart timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'courses_urbaines' AND column_name = 'eta_minutes'
  ) THEN
    ALTER TABLE courses_urbaines 
    ADD COLUMN eta_minutes integer;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_urbaines_statut_trajet ON courses_urbaines(statut_trajet);
