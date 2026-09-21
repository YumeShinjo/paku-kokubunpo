import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// フォント: M PLUS Rounded 1c(SIL Open Font License)。日本語と英数字を、太さ2種類(通常・太字)だけ同梱する。
import "@fontsource/m-plus-rounded-1c/japanese-400.css";
import "@fontsource/m-plus-rounded-1c/japanese-700.css";
import "@fontsource/m-plus-rounded-1c/latin-400.css";
import "@fontsource/m-plus-rounded-1c/latin-700.css";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
