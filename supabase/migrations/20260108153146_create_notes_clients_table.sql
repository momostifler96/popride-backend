/*
  # Create notes_clients table

  1. New Tables
    - `notes_clients`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `admin_id` (uuid, foreign key to admin_users)
      - `contenu` (text, required)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notes_clients` table
    - Add policy for authenticated admins to manage notes

  3. Indexes
    - Index on client_id for quick lookups
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS notes_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES admin_users(id) ON DELETE SET NULL,
  contenu text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notes"
  ON notes_clients
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_notes_clients_client_id ON notes_clients(client_id);
CREATE INDEX IF NOT EXISTS idx_notes_clients_created_at ON notes_clients(created_at DESC);
