-- Seed data for ColisLink
-- This script creates demo users, trips, and parcels

-- Insert demo profiles (requires manual user creation in auth first, so we'll use a function)
-- For now, we'll create some trips and parcels with user_id that should be replaced with actual user IDs

-- Demo trips (France ↔ Bénin)
INSERT INTO public.trips (user_id, from_country, from_city, to_country, to_city, date_departure, capacity_liters, capacity_available_liters, price_expect, notes, status) VALUES
-- Replace 'USER_ID_1' with actual user IDs after creating test users
('00000000-0000-0000-0000-000000000001', 'France', 'Paris', 'Bénin', 'Cotonou', CURRENT_DATE + INTERVAL '15 days', 20, 20, 50, 'Vol direct, récupération possible à CDG', 'open'),
('00000000-0000-0000-0000-000000000001', 'France', 'Lyon', 'Bénin', 'Porto-Novo', CURRENT_DATE + INTERVAL '20 days', 15, 12, 40, 'Escale à Paris', 'open'),
('00000000-0000-0000-0000-000000000002', 'Bénin', 'Cotonou', 'France', 'Paris', CURRENT_DATE + INTERVAL '25 days', 25, 25, 60, 'Retour de vacances, espace disponible', 'open'),
('00000000-0000-0000-0000-000000000002', 'Bénin', 'Parakou', 'France', 'Marseille', CURRENT_DATE + INTERVAL '30 days', 18, 15, 45, 'Vol Air France', 'open'),
('00000000-0000-0000-0000-000000000003', 'France', 'Toulouse', 'Bénin', 'Cotonou', CURRENT_DATE + INTERVAL '35 days', 22, 22, 55, 'Bagage soute disponible', 'open'),
('00000000-0000-0000-0000-000000000003', 'France', 'Nantes', 'Bénin', 'Abomey-Calavi', CURRENT_DATE + INTERVAL '40 days', 12, 10, 35, 'Petit voyage, petite capacité', 'open'),
('00000000-0000-0000-0000-000000000004', 'Bénin', 'Cotonou', 'France', 'Lyon', CURRENT_DATE + INTERVAL '45 days', 30, 28, 70, 'Grande capacité disponible', 'open'),
('00000000-0000-0000-0000-000000000004', 'France', 'Paris', 'Bénin', 'Cotonou', CURRENT_DATE + INTERVAL '50 days', 20, 18, 50, 'Voyage régulier', 'open')
ON CONFLICT DO NOTHING;

-- Demo parcels (variés)
INSERT INTO public.parcels (user_id, type, weight_kg, size, from_country, from_city, to_country, to_city, deadline, description, status) VALUES
('00000000-0000-0000-0000-000000000005', 'documents', 0.5, 'S', 'France', 'Paris', 'Bénin', 'Cotonou', CURRENT_DATE + INTERVAL '20 days', 'Documents administratifs urgents à livrer', 'open'),
('00000000-0000-0000-0000-000000000005', 'vetements', 3.2, 'M', 'France', 'Marseille', 'Bénin', 'Porto-Novo', CURRENT_DATE + INTERVAL '30 days', 'Vêtements pour enfants, don humanitaire', 'open'),
('00000000-0000-0000-0000-000000000006', 'electronique', 1.8, 'S', 'Bénin', 'Cotonou', 'France', 'Paris', CURRENT_DATE + INTERVAL '25 days', 'Téléphone portable neuf à livrer', 'open'),
('00000000-0000-0000-0000-000000000006', 'autre', 5.5, 'L', 'France', 'Lyon', 'Bénin', 'Cotonou', CURRENT_DATE + INTERVAL '35 days', 'Produits cosmétiques et cadeaux', 'open'),
('00000000-0000-0000-0000-000000000007', 'documents', 0.3, 'S', 'Bénin', 'Porto-Novo', 'France', 'Toulouse', CURRENT_DATE + INTERVAL '28 days', 'Certificats et diplômes', 'open'),
('00000000-0000-0000-0000-000000000007', 'electronique', 2.5, 'M', 'France', 'Paris', 'Bénin', 'Parakou', CURRENT_DATE + INTERVAL '40 days', 'Ordinateur portable pour étudiant', 'open'),
('00000000-0000-0000-0000-000000000008', 'vetements', 4.0, 'M', 'Bénin', 'Cotonou', 'France', 'Nantes', CURRENT_DATE + INTERVAL '32 days', 'Tenues traditionnelles', 'open'),
('00000000-0000-0000-0000-000000000008', 'autre', 2.0, 'S', 'France', 'Marseille', 'Bénin', 'Cotonou', CURRENT_DATE + INTERVAL '45 days', 'Livres et fournitures scolaires', 'open')
ON CONFLICT DO NOTHING;

-- Note: This seed data uses placeholder UUIDs. In a real scenario, you would:
-- 1. Create test users via Supabase Auth
-- 2. Get their user_ids from the profiles table
-- 3. Update this script with real user_ids
-- 4. Run this script to populate trips and parcels

-- To use this seed:
-- Replace all placeholder UUIDs (00000000-0000-0000-0000-00000000000X) with actual user IDs from your profiles table
