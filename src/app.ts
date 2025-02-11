import express from "express";
import morganMiddleware from "./middlewares/morgan.middleware";
import { apiKeyAuth } from "./middlewares/auth.middleware";
import routes from "./routes";
import "./services/whatsapp.service";

const app = express();

app.use(express.json());
app.use(morganMiddleware);

app.get("/", (req, res) => {
  res.json({ message: "WhatsApp Web API is running!" });
});

app.use(apiKeyAuth);
app.use("/api", routes);

export default app;
