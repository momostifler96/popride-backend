/*
  # Create messages table for chat functionality

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `trajet_id` (uuid, foreign key) - Reference to trajets_interurbains
      - `sender_id` (uuid) - ID of the sender (client or chauffeur)
      - `sender_type` (text) - Type of sender (client or chauffeur)
      - `receiver_id` (uuid) - ID of the receiver
      - `receiver_type` (text) - Type of receiver (client or chauffeur)
      - `message` (text) - Message content
      - `lu` (boolean) - Read status
      - `created_at` (timestamptz)

  2. Constraints
    - Check constraint: sender_type in (client, chauffeur)
    - Check constraint: receiver_type in (client, chauffeur)
    - Message cannot be empty

  3. Security
    - Enable RLS on `messages` table
    - Users can view messages they sent or received
    - Users can create messages as sender

  4. Notes
    - Used for communication between passengers and drivers
    - Messages are associated with a specific trip
*/

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trajet_id uuid NOT NULL REFERENCES trajets_interurbains(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'chauffeur')),
  receiver_id uuid NOT NULL,
  receiver_type text NOT NULL CHECK (receiver_type IN ('client', 'chauffeur')),
  message text NOT NULL CHECK (length(message) > 0),
  lu boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_trajet ON messages(trajet_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, sender_type);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id, receiver_type);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    (sender_id = auth.uid()) OR 
    (receiver_id = auth.uid())
  );

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can mark messages as read"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (receiver_id = auth.uid())
  WITH CHECK (receiver_id = auth.uid());
