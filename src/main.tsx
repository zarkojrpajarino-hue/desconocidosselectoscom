import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Logger solo muestra en desarrollo
if (import.meta.env.DEV) {
  console.log("[main] Rendering root");
}

createRoot(document.getElementById("root")!).render(<App />);
