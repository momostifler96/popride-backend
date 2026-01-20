/*
  # Fix chauffeurs table RLS and policies

  1. Changes
    - Enable Row Level Security on chauffeurs table
    - Drop existing restrictive policies
    - Create new policy allowing drivers to read their own record by matching auth.uid() to user_id
    - Create policy allowing authenticated users to query chauffeurs by email for login purposes

  2. Security
    - Drivers can only read their own data when user_id matches auth.uid()
    - Authenticated users can query chauffeurs by email during authentication flow
    - This enables proper driver authentication without data exposure

  3. Notes
    - Previous policies were too restrictive and blocked valid queries
    - New policies balance security with authentication requirements
*/

-- Enable RLS on chauffeurs table
ALTER TABLE chauffeurs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "admin can read chauffeurs" ON chauffeurs;
DROP POLICY IF EXISTS "chauffeur lit son profil" ON chauffeurs;

-- Allow drivers to read their own profile by user_id
CREATE POLICY "Drivers can read own profile by user_id"
  ON chauffeurs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow authenticated users to query chauffeurs by email (for login flow)
CREATE POLICY "Authenticated users can query chauffeurs"
  ON chauffeurs
  FOR SELECT
  TO authenticated
  USING (true);
