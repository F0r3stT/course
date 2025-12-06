-- db/schema.sql

-- 1. Таблица пользователей
CREATE TABLE IF NOT EXISTS public.users (
    id           integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username     varchar(50)  NOT NULL UNIQUE,
    password_hash varchar(255) NOT NULL,
    role         varchar(20)  NOT NULL,
    created_at   timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT users_role_check CHECK (role IN ('admin', 'operator', 'viewer'))
);

-- 2. Таблица рейсов
CREATE TABLE IF NOT EXISTS public.flights (
    id                integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    flight_number     varchar(20)    NOT NULL,
    airline_code      varchar(2),            -- IATA/условный код авиакомпании
    departure_airport varchar(3)     NOT NULL,
    arrival_airport   varchar(3)     NOT NULL,
    departure_time    timestamptz    NOT NULL,
    arrival_time      timestamptz    NOT NULL,
    status            varchar(20)    NOT NULL,
    aircraft_type     varchar(50),          -- тип ВС (A320, B738 и т.п.)
    gate_sector       varchar(10),          -- сектор/гейт (D12 и т.п.)
    CONSTRAINT flights_status_check CHECK (
      status IN ('scheduled','boarding','delayed','cancelled','in_air','landed')
    ),
    CONSTRAINT flights_dep_iata CHECK (length(departure_airport) = 3),
    CONSTRAINT flights_arr_iata CHECK (length(arrival_airport) = 3),
    CONSTRAINT flights_airline_code CHECK (
      airline_code IS NULL OR length(airline_code) = 2
    )
);

-- Индексы под табло и аналитику
CREATE INDEX IF NOT EXISTS flights_dep_time_idx
    ON public.flights (departure_time);
CREATE INDEX IF NOT EXISTS flights_arr_time_idx
    ON public.flights (arrival_time);
CREATE INDEX IF NOT EXISTS flights_dep_airport_idx
    ON public.flights (departure_airport);
CREATE INDEX IF NOT EXISTS flights_arr_airport_idx
    ON public.flights (arrival_airport);

--Роли и права доступа 
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'flights_user') THEN
    CREATE ROLE flights_user LOGIN PASSWORD 'strong_password';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'flights_analytics') THEN
    CREATE ROLE flights_analytics LOGIN PASSWORD 'analytics_password';
  END IF;
END $$;

GRANT CONNECT ON DATABASE flights_db TO flights_user, flights_analytics;
GRANT USAGE ON SCHEMA public TO flights_user, flights_analytics;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.flights TO flights_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users   TO flights_user;

GRANT SELECT ON public.flights TO flights_analytics;
GRANT SELECT ON public.users   TO flights_analytics;
