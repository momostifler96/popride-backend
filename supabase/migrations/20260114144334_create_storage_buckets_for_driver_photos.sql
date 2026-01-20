/*
  # Create Storage Buckets for Driver and Vehicle Photos

  1. Storage Buckets
    - `driver-profile-photos` - For driver profile pictures
    - `vehicle-photos` - For vehicle pictures
  
  2. Security
    - Enable public access for viewing photos
    - Allow authenticated users to upload their own photos
    - File size limit: 5MB
    - Allowed file types: image/jpeg, image/png, image/webp

  3. Policies
    - Anyone can view photos (public read)
    - Authenticated users can upload photos
    - Users can update/delete their own photos
*/

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('driver-profile-photos', 'driver-profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('vehicle-photos', 'vehicle-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Policies for driver-profile-photos bucket
CREATE POLICY "Anyone can view driver profile photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'driver-profile-photos');

CREATE POLICY "Authenticated users can upload driver profile photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'driver-profile-photos');

CREATE POLICY "Users can update their own driver profile photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'driver-profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own driver profile photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'driver-profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policies for vehicle-photos bucket
CREATE POLICY "Anyone can view vehicle photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Authenticated users can upload vehicle photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'vehicle-photos');

CREATE POLICY "Users can update their own vehicle photos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own vehicle photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'vehicle-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
