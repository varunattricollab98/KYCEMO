-- EaseMyOffice KYC Portal — geo-location capture (mandatory at video KYC).
-- Stores the client's GPS coordinates captured at the moment of recording.

alter table kyc_cases
  add column if not exists geo_lat double precision,
  add column if not exists geo_lng double precision,
  add column if not exists geo_accuracy double precision,   -- meters
  add column if not exists geo_captured_at timestamptz;
