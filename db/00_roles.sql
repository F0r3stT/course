DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'flights_analytics') THEN
    CREATE ROLE flights_analytics;
  END IF;
END $$;
