import app from "./app";
import { config } from "./config/index";

const PORT = config.app.port;

app.listen(PORT, () => {
  console.log(`🚀 MockMate AI Backend running on port ${PORT}`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/payment/webhook`);
});
