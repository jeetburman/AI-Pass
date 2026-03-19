import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// apply saved theme before render
const savedTheme = localStorage.getItem("theme") ?? "light";
document.documentElement.setAttribute("data-theme", savedTheme);