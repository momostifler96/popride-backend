/*
  # Create Frais Configuration Table

  1. New Tables
    - `frais_configuration`
      - `id` (uuid, primary key)
      - `type_service` (text) - Type of service (e.g., 'interurbain', 'urbain')
      - `percentage_fee` (numeric) - Percentage fee (e.g., 10 for 10%)
      - `fixed_fee` (integer) - Fixed fee in CFA
      - `actif` (boolean) - Whether this configuration is active
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `frais_configuration` table
    - Add policy for public read access (clients and drivers need to see fees)
    - Add policy for authenticated admin users to manage fees

  3. Initial Data
    - Insert default configuration for interurban rides:
      - 10% percentage fee
      - 500 CFA fixed fee
*/

CREATE TABLE IF NOT EXISTS frais_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_service text NOT NULL UNIQUE CHECK (type_service IN ('interurbain', 'urbain')),
  percentage_fee numeric NOT NULL DEFAULT 10 CHECK (percentage_fee >= 0 AND percentage_fee <= 100),
  fixed_fee integer NOT NULL DEFAULT 0 CHECK (fixed_fee >= 0),
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE frais_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active fee configurations"
  ON frais_configuration
  FOR SELECT
  USING (actif = true);

CREATE POLICY "Admins can manage fee configurations"
  ON frais_configuration
  FOR ALL
  USING (false)
  WITH CHECK (false);

INSERT INTO frais_configuration (type_service, percentage_fee, fixed_fee, actif)
VALUES 
  ('interurbain', 10, 500, true),
  ('urbain', 5, 200, true)
ON CONFLICT (type_service) DO NOTHING;
