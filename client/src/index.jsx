import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";

// ✅ Set backend base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL;

// ✅ Prevent sending "Bearer undefined"
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // make sure this key matches your login storage

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
