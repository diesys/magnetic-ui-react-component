import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Demo } from "./demo/Demo.tsx";
import "./styles/index.css";

const root = document.getElementById("root");
createRoot(root ?? document).render(
	<StrictMode>
		<Demo />
	</StrictMode>,
);
