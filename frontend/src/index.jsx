import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// Fontlar paketle birlikte sunulur; tarayıcı yalnızca sayfada geçen harf aralıklarını
// (ör. Türkçe için latin-ext) indirir
import "@fontsource-variable/nunito-sans/opsz.css";
import "@fontsource/varela-round/400.css";
import "./styles/global.css";
import "./styles/layout.css";
import "./styles/pages.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
