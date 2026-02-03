import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Import App (no curly braces!)

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error(
    "FATAL ERROR: Could not find element with id='root' in index.html",
  );
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
