/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `chauffeur_id` (uuid, foreign key to chauffeurs)
      - `type` (text) - notification type (ride_update, message, system)
      - `titre` (text) - notification title
      - `message` (text) - notification message
      - `lu` (boolean) - read status
      - `created_at` (timestamptz) - when notification was created
      - `metadata` (jsonb) - additional data (course_id, etc.)

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for drivers to read their own notifications
    - Add policy for drivers to update their own notifications (mark as read)
*/

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chauffeur_id uuid REFERENCES chauffeurs(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'system',
  titre text NOT NULL,
  message text NOT NULL,
  lu boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_chauffeur_id ON notifications(chauffeur_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for drivers to read their own notifications
CREATE POLICY "Drivers can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chauffeurs
      WHERE chauffeurs.id = notifications.chauffeur_id
      AND chauffeurs.user_id = auth.uid()
    )
  );

-- Policy for drivers to update their own notifications (mark as read)
CREATE POLICY "Drivers can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chauffeurs
      WHERE chauffeurs.id = notifications.chauffeur_id
      AND chauffeurs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chauffeurs
      WHERE chauffeurs.id = notifications.chauffeur_id
      AND chauffeurs.user_id = auth.uid()
    )
  );

-- Policy for system to insert notifications (for admin/system operations)
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
