import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import { App } from "./App.tsx";
import { I18nProvider, initialLang } from "./i18n/index.tsx";

const root = document.getElementById("root");
if (!root) throw new Error("missing #root");

const lang = initialLang();
document.documentElement.lang = lang;
document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
