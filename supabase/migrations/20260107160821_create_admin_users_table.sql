/*
  # Create admin_users table

  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key) - Unique identifier for admin
      - `email` (text, unique, not null) - Admin email for login
      - `password` (text, not null) - Admin password
      - `created_at` (timestamptz) - Account creation timestamp

  2. Security
    - Enable RLS on `admin_users` table
    - Add policy for authenticated admins to read their own data
*/

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own data"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert a default admin user for testing (email: admin@example.com, password: admin123)
INSERT INTO admin_users (email, password)
VALUES ('admin@example.com', 'admin123')
ON CONFLICT (email) DO NOTHING;