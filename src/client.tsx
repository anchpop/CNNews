import { createRoot } from "react-dom/client";
import { App } from "./app";

declare const DIGEST_ID: string;

createRoot(document.getElementById("root")!).render(
  <App digestId={DIGEST_ID} />
);
