/*
  # Update trajets_interurbains status options
  
  1. Changes
    - Add 'draft' and 'published' as valid status values for trajets_interurbains
    - Update default status to 'draft' instead of 'actif'
    - Keep existing statuses for backward compatibility
    
  2. Notes
    - draft: Ride created but not yet visible to clients
    - published: Ride visible to clients in the feed
    - actif: Legacy status, treated as published
    - suspendu: Temporarily suspended ride
    - termine: Completed ride
    - annule: Cancelled ride
*/

-- Drop existing constraint
ALTER TABLE trajets_interurbains 
DROP CONSTRAINT IF EXISTS trajets_interurbains_statut_check;

-- Add new constraint with draft and published
ALTER TABLE trajets_interurbains 
ADD CONSTRAINT trajets_interurbains_statut_check 
CHECK (statut IN ('draft', 'published', 'actif', 'suspendu', 'termine', 'annule'));

-- Update default value to draft
ALTER TABLE trajets_interurbains 
ALTER COLUMN statut SET DEFAULT 'draft';