-- Grant admin role to the first user
INSERT INTO user_roles (user_id, role)
VALUES ('d7a596bc-df77-4ad3-a095-23515cea42d2', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Drop existing foreign keys and recreate with CASCADE
ALTER TABLE parcels DROP CONSTRAINT IF EXISTS parcels_user_id_fkey;
ALTER TABLE parcels ADD CONSTRAINT parcels_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_user_id_fkey;
ALTER TABLE trips ADD CONSTRAINT trips_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_reviewer_id_fkey 
  FOREIGN KEY (reviewer_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_target_user_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_target_user_id_fkey 
  FOREIGN KEY (target_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_created_by_fkey;
ALTER TABLE threads ADD CONSTRAINT threads_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_other_user_id_fkey;
ALTER TABLE threads ADD CONSTRAINT threads_other_user_id_fkey 
  FOREIGN KEY (other_user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE feedbacks DROP CONSTRAINT IF EXISTS feedbacks_user_id_fkey;
ALTER TABLE feedbacks ADD CONSTRAINT feedbacks_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE flags DROP CONSTRAINT IF EXISTS flags_reporter_id_fkey;
ALTER TABLE flags ADD CONSTRAINT flags_reporter_id_fkey 
  FOREIGN KEY (reporter_id) REFERENCES profiles(user_id) ON DELETE CASCADE;

ALTER TABLE phone_verification_codes DROP CONSTRAINT IF EXISTS phone_verification_codes_user_id_fkey;
ALTER TABLE phone_verification_codes ADD CONSTRAINT phone_verification_codes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;