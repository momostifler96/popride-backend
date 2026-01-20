/*
  # Add user_id to clients table

  1. Changes
    - Add `user_id` column to link clients to auth users
    - Add unique constraint on user_id
    - Update RLS policies to use user_id
    - Backfill existing clients if possible

  2. Security
    - Update RLS policies to check user_id instead of client_id
    - Ensure clients can only access their own data
*/

-- Add user_id column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
  END IF;
END $$;

-- Update RLS policies for reservations to use clients.user_id
DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations_interurbaines;
DROP POLICY IF EXISTS "Users can create their own reservations" ON reservations_interurbaines;
DROP POLICY IF EXISTS "Users can update their own reservations" ON reservations_interurbaines;
DROP POLICY IF EXISTS "Users can delete their own reservations" ON reservations_interurbaines;

CREATE POLICY "Users can view their own reservations"
  ON reservations_interurbaines
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create their own reservations"
  ON reservations_interurbaines
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their own reservations"
  ON reservations_interurbaines
  FOR UPDATE
  TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  )
  WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete their own reservations"
  ON reservations_interurbaines
  FOR DELETE
  TO authenticated
  USING (
    client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
  );
