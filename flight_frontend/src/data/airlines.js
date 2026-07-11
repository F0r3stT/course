// src/data/airlines.js
export const airlinesData = {
  SU: {
    code: "SU",
    name: "Аэрофлот",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Aeroflot_logo_ru.svg",
    color: "#004d99",
    country: "Россия"
  },
  S7: {
    code: "S7",
    name: "S7 Airlines",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/S7_airlines_logo.svg",
    color: "#008c45",
    country: "Россия"
  },
  U6: {
    code: "U6",
    name: "Уральские авиалинии",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9f/Ural_Airlines_logo.svg",
    color: "#003366",
    country: "Россия"
  },
  TK: {
    code: "TK",
    name: "Turkish Airlines",
    logo: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Turkish_Airlines_logo_2019.svg",
    color: "#c60c30",
    country: "Турция"
  },
  LH: {
    code: "LH",
    name: "Lufthansa",
    logo: "https://upload.wikimedia.org/wikipedia/commons/8/8e/Lufthansa_Logo_2018.svg",
    color: "#1c1c1c",
    country: "Германия"
  },
  // Дополнительные авиакомпании
  UT: {
    code: "UT",
    name: "UTair Aviation",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/f5/UTair_logo.svg",
    color: "#0099cc",
    country: "Россия"
  },
  DP: {
    code: "DP",
    name: "Победа",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Pobeda_logo.svg",
    color: "#e4002b",
    country: "Россия"
  },
  FV: {
    code: "FV",
    name: "Россия",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Rossiya_Airlines_logo.svg",
    color: "#0039a6",
    country: "Россия"
  }
};

export const getAirlineInfo = (code) => {
  return airlinesData[code] || {
    code: code,
    name: code || "Неизвестная авиакомпания",
    logo: null,
    color: "#666",
    country: ""
  };
};