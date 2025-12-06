--
-- PostgreSQL database dump
--

\restrict s6NC5hVJGih4f38TL3CveQnIg0m1Vs9dRlWdvVf1Ig00LDZoMG00The8dGI3Vfm

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
-- Name: flights; Type: TABLE; Schema: public; Owner: flights_user
--

CREATE TABLE public.flights (
    id integer NOT NULL,
    flight_number character varying(20) NOT NULL,
    departure_airport character varying(3) NOT NULL,
    arrival_airport character varying(3) NOT NULL,
    departure_time timestamp with time zone NOT NULL,
    arrival_time timestamp with time zone NOT NULL,
    status character varying(20) NOT NULL,
    CONSTRAINT flights_airport_code_length CHECK (((char_length((departure_airport)::text) = 3) AND (char_length((arrival_airport)::text) = 3))),
    CONSTRAINT flights_status_check CHECK (((status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('boarding'::character varying)::text, ('delayed'::character varying)::text, ('cancelled'::character varying)::text, ('in_air'::character varying)::text, ('landed'::character varying)::text]))),
    CONSTRAINT flights_time_check CHECK ((arrival_time > departure_time))
);


ALTER TABLE public.flights OWNER TO flights_user;

--
-- Name: flights_id_seq; Type: SEQUENCE; Schema: public; Owner: flights_user
--

CREATE SEQUENCE public.flights_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.flights_id_seq OWNER TO flights_user;

--
-- Name: flights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: flights_user
--

ALTER SEQUENCE public.flights_id_seq OWNED BY public.flights.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: flights_user
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('operator'::character varying)::text, ('viewer'::character varying)::text])))
);


ALTER TABLE public.users OWNER TO flights_user;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: flights_user
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO flights_user;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: flights_user
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: flights id; Type: DEFAULT; Schema: public; Owner: flights_user
--

ALTER TABLE ONLY public.flights ALTER COLUMN id SET DEFAULT nextval('public.flights_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: flights_user
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: flights; Type: TABLE DATA; Schema: public; Owner: flights_user
--

COPY public.flights (id, flight_number, departure_airport, arrival_airport, departure_time, arrival_time, status) FROM stdin;
4	BAS	RES	LRN	2025-12-01 07:58:00+07	2025-12-02 08:58:00+07	boarding
6	AIR2	RES	LRN	2025-12-02 10:25:00+07	2025-12-03 10:25:00+07	boarding
9	SEC1	SVO	LHR	2025-12-05 17:00:00+07	2025-12-05 20:00:00+07	scheduled
3	BA300	LHE	DXB	2025-12-04 18:00:00+07	2025-12-05 04:00:00+07	delayed
11	s7 7547	NKO	BRL	2025-12-05 22:03:00+07	2025-12-05 23:03:00+07	scheduled
12	S7 2523	SVO	NKR	2025-12-05 22:09:00+07	2025-12-06 02:03:00+07	scheduled
13	2425	NUD	SVO	2025-12-05 22:23:00+07	2025-12-06 22:23:00+07	delayed
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: flights_user
--

COPY public.users (id, username, password_hash, role, created_at) FROM stdin;
1	admin	$2a$10$kfrLAUTSrbGYTZU13i2opu4Lk/HsAvkM8wG4Ed9mEXacXsnbFcFVa	admin	2025-12-04 23:52:40.586976+07
\.


--
-- Name: flights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: flights_user
--

SELECT pg_catalog.setval('public.flights_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: flights_user
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO flights_analytics;


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

\unrestrict s6NC5hVJGih4f38TL3CveQnIg0m1Vs9dRlWdvVf1Ig00LDZoMG00The8dGI3Vfm

