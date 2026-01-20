/*
  # Update courses tables to reference clients

  1. Changes
    - Add client_id column to courses_urbaines
    - Add client_id column to trajets_interurbains (for reservations tracking)

  2. Notes
    - Keep existing client_nom and client_telephone for backward compatibility
    - client_id is nullable as some courses may not have registered clients
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses_urbaines' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE courses_urbaines 
    ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_courses_urbaines_client_id ON courses_urbaines(client_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trajets_interurbains' AND column_name = 'places_reservees'
  ) THEN
    ALTER TABLE trajets_interurbains 
    ADD COLUMN places_reservees integer DEFAULT 0,
    ADD COLUMN prix_par_place numeric DEFAULT 0;
  END IF;
END $$;
