import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import documentsRouter from "./routes/documents";
import chatRouter from "./routes/chat";

const app = express();
const PORT = process.env.PORT ?? 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api/documents", documentsRouter);
app.use("/api/chat", chatRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    time: new Date().toISOString(),
  });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
