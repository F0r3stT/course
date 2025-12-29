--
-- PostgreSQL database dump
--

\restrict gBF4bRQAtU6YVzVP1rykxL03yPTcEc5gsdqpmIgoYAT3Y7bDfZ1OSSHAOreSHwg


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
-- Data for Name: airlines; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.airlines (code, name) FROM stdin;
SU	Аэрофлот
S7	S7 Airlines
U6	Уральские авиалинии
TK	Turkish Airlines
LH	Lufthansa
BA	British Airways
EK	Emirates
\.


--
-- Data for Name: flights; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.flights (id, flight_number, airline_code, departure_airport, arrival_airport, departure_time, arrival_time, status, aircraft_type, gate_sector, airline_name, original_departure_time, original_arrival_time) FROM stdin;
16	56823	\N	DME	VKO	2025-12-06 11:22:00+07	2025-12-06 17:22:00+07	scheduled	\N	\N	\N	\N	\N
27	533523	S7	SVO	PUL	2025-12-07 20:52:00+07	2025-12-08 05:02:00+07	scheduled	Boeing 777	\N	S7 Airlines	\N	\N
29	43242	SU	VKO	VVO	2025-12-09 16:45:00+07	2025-12-10 02:45:00+07	scheduled	Airbus A320	\N	Аэрофлот	\N	\N
14	5324	\N	SVO	TOM	2025-12-07 06:07:00+07	2025-12-07 15:07:00+07	landed	\N	\N	\N	\N	\N
15	4342	\N	SVO	TOM	2025-12-07 07:20:00+07	2025-12-07 15:20:00+07	landed	\N	\N	\N	\N	\N
28	324535	BA	SVO	OVB	2025-12-09 16:08:00+07	2025-12-09 20:08:00+07	landed	Boeing 787	\N	British Airways	\N	\N
13	2425	\N	NUD	SVO	2025-12-06 00:23:00+07	2025-12-07 00:23:00+07	landed	\N	\N	\N	\N	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password_hash, role, created_at) FROM stdin;
1	admin	$2a$10$kfrLAUTSrbGYTZU13i2opu4Lk/HsAvkM8wG4Ed9mEXacXsnbFcFVa	admin	2025-12-04 23:52:40.586976+07
\.


--
-- Name: flights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval(
  'public.flights_id_seq',
  (SELECT COALESCE(MAX(id),0) FROM public.flights),
  true
);

--
-- PostgreSQL database dump complete
--

\unrestrict gBF4bRQAtU6YVzVP1rykxL03yPTcEc5gsdqpmIgoYAT3Y7bDfZ1OSSHAOreSHwg

