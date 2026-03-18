import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error(
    "FATAL ERROR: Could not find element with id='root' in index.html",
  );
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <App />
  );
}
