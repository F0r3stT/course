// src/api/authApi.js
const API_BASE = "http://localhost:8080";

export async function login(username, password) {
  const res = await fetch("/api/...", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let message = "Ошибка входа";
    try {
      const data = await res.json();
      if (data && data.error) {
        message = data.error;
      }
    } catch {
    }
    throw new Error(message);
  }

  const data = await res.json(); 
  return data;
}

