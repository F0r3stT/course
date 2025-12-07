--
-- PostgreSQL database dump
--

\restrict h9ALxELJ7s24Rp9APEeRhDTRTh6UAem1L9rZQyfRzPrg5eAHrGa99KxxhRC4uow

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

--
-- Data for Name: airlines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.airlines (code, name) FROM stdin;
\.


--
-- Data for Name: flights; Type: TABLE DATA; Schema: public; Owner: flights_user
--

COPY public.flights (id, flight_number, airline_code, departure_airport, arrival_airport, departure_time, arrival_time, status, aircraft_type, gate_sector, airline_name) FROM stdin;
13	2425	\N	NUD	SVO	2025-12-05 22:23:00+07	2025-12-06 22:23:00+07	delayed	\N	\N	\N
14	5324	\N	SVO	TOM	2025-12-07 06:07:00+07	2025-12-07 15:07:00+07	scheduled	\N	\N	\N
15	4342	\N	SVO	TOM	2025-12-07 07:20:00+07	2025-12-07 15:20:00+07	delayed	\N	\N	\N
16	56823	\N	DME	VKO	2025-12-06 11:22:00+07	2025-12-06 17:22:00+07	scheduled	\N	\N	\N
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

SELECT pg_catalog.setval('public.flights_id_seq', 16, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: flights_user
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict h9ALxELJ7s24Rp9APEeRhDTRTh6UAem1L9rZQyfRzPrg5eAHrGa99KxxhRC4uow

