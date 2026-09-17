import app from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`NguonC add-on running at ${config.baseUrl}`);
  console.log(`Manifest: ${config.baseUrl}/manifest.json`);
});
