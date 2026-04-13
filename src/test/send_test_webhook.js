const axios = require("axios");
require("dotenv").config();

const port = process.env.PORT || 3000;
const token = process.env.LOFTY_API_TOKEN;
if (!token) {
  console.error("LOFTY_API_TOKEN not set in environment (.env)");
  process.exit(1);
}

const url = `http://localhost:${port}/lofty/webhook`;

(async function sendTest() {
  try {
    const payload = { contactId: "test-contact", message: "Hello from test webhook" };
    const resp = await axios.post(url, payload, { headers: { Authorization: `Bearer ${token}` } });
    console.log("Webhook response:", resp.data);
  } catch (err) {
    console.error("Error sending test webhook:", err.response?.data || err.message || err);
    process.exit(1);
  }
})();
