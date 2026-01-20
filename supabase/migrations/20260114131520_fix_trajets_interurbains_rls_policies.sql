/*
  # Fix RLS policies for trajets_interurbains

  1. Changes
    - Update INSERT policy to use user_id from chauffeurs table
    - Update UPDATE policy to be more restrictive (only chauffeurs can update their own rides)
    - Update DELETE policy to be more restrictive (only chauffeurs can delete their own rides)

  2. Security
    - Chauffeurs can only insert rides for themselves
    - Chauffeurs can only update/delete their own rides
    - All authenticated users can view rides (for clients to see available rides)
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Chauffeurs can insert their own trajets" ON trajets_interurbains;
DROP POLICY IF EXISTS "Authenticated users can update trajets" ON trajets_interurbains;
DROP POLICY IF EXISTS "Authenticated users can delete trajets" ON trajets_interurbains;

-- Create new policies
CREATE POLICY "Chauffeurs can insert their own trajets"
  ON trajets_interurbains
  FOR INSERT
  TO authenticated
  WITH CHECK (
    chauffeur_id IN (SELECT id FROM chauffeurs WHERE user_id = auth.uid())
  );

CREATE POLICY "Chauffeurs can update their own trajets"
  ON trajets_interurbains
  FOR UPDATE
  TO authenticated
  USING (
    chauffeur_id IN (SELECT id FROM chauffeurs WHERE user_id = auth.uid())
  )
  WITH CHECK (
    chauffeur_id IN (SELECT id FROM chauffeurs WHERE user_id = auth.uid())
  );

CREATE POLICY "Chauffeurs can delete their own trajets"
  ON trajets_interurbains
  FOR DELETE
  TO authenticated
  USING (
    chauffeur_id IN (SELECT id FROM chauffeurs WHERE user_id = auth.uid())
  );
