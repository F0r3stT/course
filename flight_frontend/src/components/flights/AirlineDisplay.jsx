// src/components/flights/AirlineDisplay.jsx
import React from "react";
import { getAirlineInfo } from "../../data/airlines";

export default function AirlineDisplay({ code, showLogo = true, showName = true, size = "medium" }) {
  const airline = getAirlineInfo(code);
  
  const sizes = {
    small: { logo: 20, fontSize: "0.8rem" },
    medium: { logo: 32, fontSize: "0.9rem" },
    large: { logo: 48, fontSize: "1.1rem" }
  };
  
  const { logo: logoSize, fontSize } = sizes[size];

  return (
    <div className="airline-display" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {showLogo && airline.logo ? (
        <img 
          src={airline.logo} 
          alt={airline.name}
          style={{ 
            width: logoSize, 
            height: logoSize, 
            objectFit: "contain",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
          }}
        />
      ) : (
        <div 
          className="airline-placeholder"
          style={{
            width: logoSize,
            height: logoSize,
            backgroundColor: airline.color,
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: logoSize * 0.5,
            fontWeight: "bold"
          }}
        >
          {airline.code}
        </div>
      )}
      
      {showName && (
        <div style={{ fontSize }}>
          <div style={{ fontWeight: "600", color: "#333" }}>
            {airline.name}
          </div>
          {airline.country && (
            <div style={{ fontSize: "0.8em", color: "#666", marginTop: "2px" }}>
              {airline.country}
            </div>
          )}
        </div>
      )}
    </div>
  );
}