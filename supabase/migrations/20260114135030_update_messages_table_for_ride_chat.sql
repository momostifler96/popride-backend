/*
  # Update messages table for ride-based group chat

  ## Summary
  Transform messages table from point-to-point to ride-based group chat system.
  Each interurban ride has one chat where the driver and all interested clients can participate.

  ## Changes
  1. Drop existing messages table and recreate with new schema
  2. New structure:
    - `id` (uuid, primary key)
    - `trajet_id` (uuid, foreign key to trajets_interurbains)
    - `sender_id` (uuid, the user who sent the message)
    - `sender_role` (text, either 'client' or 'chauffeur')
    - `message` (text, message content)
    - `created_at` (timestamptz, timestamp)
  
  ## Security
  1. Enable RLS on messages table
  2. Policies:
    - Clients can view messages for rides they have access to
    - Chauffeurs can view messages for their rides
    - Authenticated users can send messages to rides they participate in
  
  ## Notes
  - This enables group chat per ride instead of one-to-one messaging
  - All participants of a ride can see all messages in that ride's chat
  - Chat history is preserved and loaded chronologically
*/

-- Drop existing messages table
DROP TABLE IF EXISTS messages CASCADE;

-- Create new messages table for ride-based chat
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trajet_id uuid NOT NULL REFERENCES trajets_interurbains(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'chauffeur')),
  message text NOT NULL CHECK (length(trim(message)) > 0),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_trajet_created ON messages(trajet_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Chauffeurs can view messages for their rides
CREATE POLICY "Chauffeurs can view messages for their rides"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trajets_interurbains t
      INNER JOIN chauffeurs c ON c.id = t.chauffeur_id
      WHERE t.id = messages.trajet_id
      AND c.user_id = auth.uid()
    )
  );

-- Policy: Clients can view messages for rides (all published rides)
CREATE POLICY "Clients can view messages for published rides"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trajets_interurbains t
      WHERE t.id = messages.trajet_id
      AND t.statut IN ('published', 'actif')
    )
    AND EXISTS (
      SELECT 1 FROM clients c
      WHERE c.user_id = auth.uid()
    )
  );

-- Policy: Chauffeurs can send messages to their rides
CREATE POLICY "Chauffeurs can send messages to their rides"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_role = 'chauffeur'
    AND sender_id IN (
      SELECT c.id FROM chauffeurs c
      WHERE c.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM trajets_interurbains t
      INNER JOIN chauffeurs c ON c.id = t.chauffeur_id
      WHERE t.id = trajet_id
      AND c.user_id = auth.uid()
    )
  );

-- Policy: Clients can send messages to published rides
CREATE POLICY "Clients can send messages to published rides"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_role = 'client'
    AND sender_id IN (
      SELECT c.id FROM clients c
      WHERE c.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM trajets_interurbains t
      WHERE t.id = trajet_id
      AND t.statut IN ('published', 'actif')
    )
  );
