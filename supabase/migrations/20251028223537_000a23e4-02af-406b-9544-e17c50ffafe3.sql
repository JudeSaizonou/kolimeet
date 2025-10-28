-- Renommer les colonnes de capacité en litres vers kg pour les trajets
ALTER TABLE trips 
  RENAME COLUMN capacity_liters TO capacity_kg;

ALTER TABLE trips 
  RENAME COLUMN capacity_available_liters TO capacity_available_kg;