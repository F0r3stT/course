--
-- PostgreSQL database dump
--

\restrict 8570YhI2vo8gMrVTWxouKlMhX9gWLgYONtluH1fTJOaecTjuGvOhOZl3YKh7DL7


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;


CREATE TABLE public.flights (
    id integer NOT NULL,
    flight_number character varying(20) NOT NULL,
    departure_airport character varying(3) NOT NULL,
    arrival_airport character varying(3) NOT NULL,
    departure_time timestamp with time zone NOT NULL,
    arrival_time timestamp with time zone NOT NULL,
    status character varying(20) NOT NULL
);


ALTER TABLE public.flights OWNER TO flights_user;


CREATE SEQUENCE public.flights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flights_id_seq OWNER TO flights_user;


ALTER SEQUENCE public.flights_id_seq OWNED BY public.flights.id;


ALTER TABLE ONLY public.flights ALTER COLUMN id SET DEFAULT nextval('public.flights_id_seq'::regclass);


ALTER TABLE ONLY public.flights
    ADD CONSTRAINT flights_pkey PRIMARY KEY (id);


\unrestrict 8570YhI2vo8gMrVTWxouKlMhX9gWLgYONtluH1fTJOaecTjuGvOhOZl3YKh7DL7

