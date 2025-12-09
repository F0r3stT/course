// src/components/flights/FlightSearch.jsx
import React, { useState } from "react";
import { AIRPORT_TO_CITY } from "../../utils/airports";

export default function FlightSearch({ flights = [], onSearchResults }) {
  const [searchType, setSearchType] = useState("flightNumber");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!searchValue.trim()) {
      onSearchResults([]);
      return;
    }

    setLoading(true);
    
    setTimeout(() => {
      let results = [];
      const searchTerm = searchValue.toLowerCase().trim();

      if (searchType === "flightNumber") {
        // Поиск по номеру рейса
        results = flights.filter(flight => 
          flight.flight_number && 
          flight.flight_number.toLowerCase().includes(searchTerm)
        ).slice(0, 7);
      } else if (searchType === "city") {
        // Поиск по городу (через коды аэропортов)
        results = flights.filter(flight => {
          const depCity = AIRPORT_TO_CITY[flight.departure_airport] || "";
          const arrCity = AIRPORT_TO_CITY[flight.arrival_airport] || "";
          return (
            depCity.toLowerCase().includes(searchTerm) ||
            arrCity.toLowerCase().includes(searchTerm)
          );
        }).slice(0, 7);
      }

      onSearchResults(results);
      setLoading(false);
    }, 300);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchValue("");
    onSearchResults([]);
  };

  return (
    <div className="flight-search-container">
      <div className="search-header">
        <h3 className="search-title">Поиск рейсов</h3>
        <div className="search-type-selector">
          <label className={`search-type-option ${searchType === "flightNumber" ? "active" : ""}`}>
            <input
              type="radio"
              name="searchType"
              value="flightNumber"
              checked={searchType === "flightNumber"}
              onChange={(e) => setSearchType(e.target.value)}
            />
            По номеру рейса
          </label>
          <label className={`search-type-option ${searchType === "city" ? "active" : ""}`}>
            <input
              type="radio"
              name="searchType"
              value="city"
              checked={searchType === "city"}
              onChange={(e) => setSearchType(e.target.value)}
            />
            По городу
          </label>
        </div>
      </div>

      <div className="search-input-group">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              searchType === "flightNumber" 
                ? "Введите номер рейса (например, 2425)" 
                : "Введите название города (например, Москва)"
            }
            className="search-input"
          />
          {searchValue && (
            <button onClick={handleClear} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>
        <button onClick={handleSearch} className="search-btn" disabled={loading}>
          {loading ? "Поиск..." : "Найти"}
        </button>
      </div>

      <div className="search-tips">
        <p><strong>💡 Советы по поиску:</strong></p>
        <ul>
          <li>Номер рейса должен содержать только цифры</li>
          <li>Для поиска по городу используйте полное название</li>
          <li>Поиск по городу покажет последние 7 рейсов</li>
        </ul>
      </div>
    </div>
  );
}