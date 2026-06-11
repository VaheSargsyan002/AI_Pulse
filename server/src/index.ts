import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import documentRoutes from "./routes/document.routes";
import chatRoutes from "./routes/chat.routes";

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
