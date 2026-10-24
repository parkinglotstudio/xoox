import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Game } from "./engine";
import "./style.css";
import "./ui-scale.css";
import "./expansion.css";
import "./rescue.css";
// Allocate outside React render: StrictMode may discard an initial render.
const game = new Game();
const root = createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <App ownedGame={game} />
  </React.StrictMode>,
);

if (import.meta.hot) import.meta.hot.dispose(() => root.unmount());
