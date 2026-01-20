/*
  # Create reservations_interurbaines table

  1. New Tables
    - `reservations_interurbaines`
      - `id` (uuid, primary key)
      - `trajet_id` (uuid, foreign key) - Reference to trajets_interurbains
      - `client_id` (uuid, foreign key) - Reference to clients
      - `nombre_places` (integer) - Number of seats booked
      - `prix_total` (decimal) - Total price for the booking
      - `statut` (text) - Booking status (en_attente, confirmee, annulee)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Constraints
    - Check constraint: nombre_places > 0
    - Check constraint: prix_total >= 0
    - Check constraint: statut values

  3. Security
    - Enable RLS on `reservations_interurbaines` table
    - Add policies for authenticated users to manage their reservations

  4. Notes
    - Clients can book multiple seats on a trip
    - Reservations update the places_reservees count in trajets_interurbains
*/

CREATE TABLE IF NOT EXISTS reservations_interurbaines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trajet_id uuid NOT NULL REFERENCES trajets_interurbains(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  nombre_places integer NOT NULL CHECK (nombre_places > 0),
  prix_total decimal(10,2) NOT NULL CHECK (prix_total >= 0),
  statut text NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'confirmee', 'annulee')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_interurbaines_trajet ON reservations_interurbaines(trajet_id);
CREATE INDEX IF NOT EXISTS idx_reservations_interurbaines_client ON reservations_interurbaines(client_id);
CREATE INDEX IF NOT EXISTS idx_reservations_interurbaines_statut ON reservations_interurbaines(statut);

ALTER TABLE reservations_interurbaines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reservations"
  ON reservations_interurbaines
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Users can create their own reservations"
  ON reservations_interurbaines
  FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can update their own reservations"
  ON reservations_interurbaines
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can delete their own reservations"
  ON reservations_interurbaines
  FOR DELETE
  TO authenticated
  USING (client_id = auth.uid());
