import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import path from "path";
import documentRoutes from "./routes/document.routes";
import chatRoutes from "./routes/chat.routes";

const app = express();
const PORT = process.env.PORT ?? 5000;
const isProd = process.env.NODE_ENV === "production";

app.use(cors({ origin: isProd ? process.env.CORS_ORIGIN ?? "*" : "http://localhost:5173" }));
app.use(express.json());

app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

if (isProd) {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
