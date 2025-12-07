// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";      // базовый reset/typography
import "./App.css";        // общий каркас приложения
import "./styles/layout.css";
import "./styles/controls.css";
import "./styles/table.css";
import "./styles/modal.css";
import "./styles/board.css";

import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
