--
-- PostgreSQL database dump
--

\restrict 2nDELsf80t1llwJfEUQWZFAbZTJlrpjONWoXTSaHcSTkQky0Rs2DLl8CbKox5L3

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

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

--
-- Name: airlines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.airlines (
    code character(2) NOT NULL,
    name text NOT NULL
);


ALTER TABLE public.airlines OWNER TO postgres;

--
-- Name: flights; Type: TABLE; Schema: public; Owner: flights_user
--

CREATE TABLE public.flights (
    id integer NOT NULL,
    flight_number character varying(20) NOT NULL,
    airline_code character varying(2),
    departure_airport character varying(3) NOT NULL,
    arrival_airport character varying(3) NOT NULL,
    departure_time timestamp with time zone NOT NULL,
    arrival_time timestamp with time zone NOT NULL,
    status character varying(20) NOT NULL,
    aircraft_type character varying(50),
    gate_sector character varying(10),
    airline_name text,
    CONSTRAINT flights_airline_code CHECK (((airline_code IS NULL) OR (length((airline_code)::text) = 2))),
    CONSTRAINT flights_arr_iata CHECK ((length((arrival_airport)::text) = 3)),
    CONSTRAINT flights_dep_iata CHECK ((length((departure_airport)::text) = 3)),
    CONSTRAINT flights_flight_number_digits CHECK (((flight_number)::text ~ '^[0-9]{3,6}$'::text)),
    CONSTRAINT flights_status_check CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'boarding'::character varying, 'delayed'::character varying, 'cancelled'::character varying, 'in_air'::character varying, 'landed'::character varying])::text[])))
);


ALTER TABLE public.flights OWNER TO flights_user;

--
-- Name: flights_id_seq; Type: SEQUENCE; Schema: public; Owner: flights_user
--

ALTER TABLE public.flights ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.flights_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: flights_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'operator'::character varying, 'viewer'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO flights_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: flights_user
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: airlines airlines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.airlines
    ADD CONSTRAINT airlines_pkey PRIMARY KEY (code);


--
-- Name: flights flights_pkey; Type: CONSTRAINT; Schema: public; Owner: flights_user
--

ALTER TABLE ONLY public.flights
    ADD CONSTRAINT flights_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: flights_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: flights_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: flights_arr_airport_idx; Type: INDEX; Schema: public; Owner: flights_user
--

CREATE INDEX flights_arr_airport_idx ON public.flights USING btree (arrival_airport);


--
-- Name: flights_arr_time_idx; Type: INDEX; Schema: public; Owner: flights_user
--

CREATE INDEX flights_arr_time_idx ON public.flights USING btree (arrival_time);


--
-- Name: flights_dep_airport_idx; Type: INDEX; Schema: public; Owner: flights_user
--

CREATE INDEX flights_dep_airport_idx ON public.flights USING btree (departure_airport);


--
-- Name: flights_dep_time_idx; Type: INDEX; Schema: public; Owner: flights_user
--

CREATE INDEX flights_dep_time_idx ON public.flights USING btree (departure_time);


--
-- Name: flights flights_airline_fk; Type: FK CONSTRAINT; Schema: public; Owner: flights_user
--

ALTER TABLE ONLY public.flights
    ADD CONSTRAINT flights_airline_fk FOREIGN KEY (airline_code) REFERENCES public.airlines(code);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO flights_user;
GRANT USAGE ON SCHEMA public TO flights_analytics;


--
-- Name: TABLE airlines; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.airlines TO flights_user;


--
-- Name: TABLE flights; Type: ACL; Schema: public; Owner: flights_user
--

GRANT SELECT ON TABLE public.flights TO flights_analytics;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: flights_user
--

GRANT SELECT ON TABLE public.users TO flights_analytics;


--
-- PostgreSQL database dump complete
--

\unrestrict 2nDELsf80t1llwJfEUQWZFAbZTJlrpjONWoXTSaHcSTkQky0Rs2DLl8CbKox5L3

