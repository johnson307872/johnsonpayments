// =============================================
// 🔐 PayHero Authenticated Payment Server
// Run: node "java payments.js"
// =============================================

const express    = require("express");
const axios      = require("axios");
const cors       = require("cors");
const bodyParser = require("body-parser");
const path       = require("path");
const { randomUUID } = require("crypto");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
  res.type("html").send(
    "<!doctype html><html><head><meta charset=\"utf-8\"><title>PayHero API</title></head>" +
    "<body><h1>PayHero API is running</h1><p>Use POST /pay to initiate a payment and " +
    "GET /status/:reference to check its status.</p></body></html>"
  );
});

// ✅ YOUR PAYHERO API CREDENTIALS 
// (In a real production app, store these in a .env file!)
const API_USERNAME = "Xdsk6MQBTGCa3UcGhDXG";
const API_PASSWORD = "EljTF5iD0OmfUPyC2b0E0NZvi0OteXcUEy18zMlP";
const CHANNEL_ID   = 10283;

// ✅ Using your generated Basic Auth Token
const BASIC_AUTH_TOKEN = "WGRzazZNUUJUR0NhM1VjR2hEWEc6RWxqVEY1aUQwT21mVVB5QzJiMEUwTlp2aTBPdGVYY1VFeTE4ek1sUA==";

// =============================================
// 📌 ROUTE: Initiate STK Push Payment
// =============================================
app.post("/pay", async (req, res) => {
  const { phone, amount, reference: suppliedReference, name } = req.body;
  const reference = suppliedReference || `KP-${randomUUID()}`;

  // Basic validation
  if (!phone || !amount) {
    return res.status(400).json({ error: "Phone and amount are required." });
  }

  try {
    const response = await axios.post(
      "https://backend.payhero.co.ke/api/v2/payments",
      {
        amount:             amount,
        phone_number:       phone,
        channel_id:         CHANNEL_ID,
        provider:           "m-pesa",
        external_reference: reference,
        customer_name:      name || "Customer",
        callback_url:       "https://yourwebsite.com/callback", // 🔁 Update when you go live
      },
      {
        headers: {
          "Authorization": `Basic ${BASIC_AUTH_TOKEN}`,
          "Content-Type":  "application/json",
        },
      }
    );

    console.log("✅ Payment Initiated:", response.data);
    res.json({ success: true, reference, data: response.data });

  } catch (error) {
    console.error("❌ Payment Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.response?.data || "Payment failed" });
  }
});

// =============================================
// 📌 ROUTE: Check Payment Status
// =============================================
app.get("/status/:reference", async (req, res) => {
  const { reference } = req.params;

  try {
    const response = await axios.get(
      `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${reference}`,
      {
        headers: {
          "Authorization": `Basic ${BASIC_AUTH_TOKEN}`,
          "Content-Type":  "application/json",
        },
      }
    );

    console.log("📋 Transaction Status:", response.data);
    res.json({ success: true, data: response.data });

  } catch (error) {
    console.error("❌ Status Check Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Status check failed" });
  }
});

// =============================================
// 📌 ROUTE: PayHero Webhook Callback
// =============================================
app.post("/callback", (req, res) => {
  const payload = req.body;
  console.log("🔔 Payment Callback Received:", JSON.stringify(payload, null, 2));

  // Handle your successful payment database logic here
  
  res.status(200).json({ message: "Callback received" });
});

// Start Server
const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});