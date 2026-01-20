/*
  # Add policy for drivers to view reservations on their rides

  1. Changes
    - Add SELECT policy for drivers to view reservations for their own rides

  2. Security
    - Drivers can only see reservations for rides they created
    - Clients can still see their own reservations (existing policy)
*/

-- Add policy for drivers to view reservations on their rides
CREATE POLICY "Drivers can view reservations for their rides"
  ON reservations_interurbaines
  FOR SELECT
  TO authenticated
  USING (
    trajet_id IN (
      SELECT t.id 
      FROM trajets_interurbains t
      JOIN chauffeurs c ON t.chauffeur_id = c.id
      WHERE c.user_id = auth.uid()
    )
  );
