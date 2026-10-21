const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json({limit:"100kb"}));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const TMDB_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const plans = { Basic: 99, Standard: 199, Premium: 299 };
const razorpay = (RZP_KEY_ID && RZP_KEY_SECRET)
  ? new Razorpay({ key_id: RZP_KEY_ID, key_secret: RZP_KEY_SECRET })
  : null;

async function tmdb(pathname) {
  if (!TMDB_TOKEN) throw new Error("TMDB API token is not configured on the server.");
  const response = await fetch("https://api.themoviedb.org/3" + pathname, {
    headers: { Authorization: "Bearer " + TMDB_TOKEN, accept: "application/json" }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.status_message || "TMDB request failed");
  return data;
}
app.get("/api/movies", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    const language = ["hi", "mr"].includes(req.query.language) ? req.query.language : "";
    let endpoint;
    if (query) {
      const params = new URLSearchParams({ query, include_adult: "false", page: "1" });
      if (language) params.set("with_original_language", language);
      endpoint = "/search/movie?" + params.toString();
    } else {
      const params = new URLSearchParams({ sort_by: "popularity.desc", include_adult: "false", page: "1" });
      if (language) params.set("with_original_language", language);
      else params.set("with_original_language", "hi|mr");
      endpoint = "/discover/movie?" + params.toString();
    }
    const data = await tmdb(endpoint);
    res.json({ results: (data.results || []).filter(m => !m.adult) });
  } catch (err) { res.status(502).json({ error: err.message }); }
});
app.get("/api/movies/:id", async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "Invalid movie id." });
  try {
    const data = await tmdb("/movie/" + req.params.id + "?append_to_response=videos,credits");
    res.json(data);
  } catch (err) { res.status(502).json({ error: err.message }); }
});
app.post("/api/create-order", async (req, res) => {
  try {
    if (!razorpay) return res.status(503).json({ error: "Payment gateway not configured. Set Razorpay API keys in server environment." });
    const plan = String(req.body.plan || "");
    const name = String(req.body.name || "").trim().slice(0, 100);
    const email = String(req.body.email || "").trim().slice(0, 200);
    if (!plans[plan]) return res.status(400).json({ error: "Select a valid plan." });
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid name and email." });
    const amount = plans[plan] * 100; // INR paise
    const order = await razorpay.orders.create({
      amount, currency: "INR", receipt: "cp_" + crypto.randomBytes(8).toString("hex"),
      notes: { plan, customer_email: email, customer_name: name }
    });
    res.json({ keyId: RZP_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) { console.error("Create order error:", err.message); res.status(502).json({ error: "Could not create payment order. Check Razorpay configuration." }); }
});
app.post("/api/verify-payment", async (req, res) => {
  try {
    if (!RZP_KEY_SECRET) return res.status(503).json({ error: "Payment verification is not configured." });
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
    if (![razorpay_order_id, razorpay_payment_id, razorpay_signature].every(v => typeof v === "string" && v.length > 0))
      return res.status(400).json({ error: "Missing payment verification fields." });
    const expected = crypto.createHmac("sha256", RZP_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
    const a = Buffer.from(expected, "utf8"), b = Buffer.from(razorpay_signature, "utf8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b))
      return res.status(400).json({ error: "Payment signature is invalid." });
    // Production note: persist order/payment/plan in a database and reconcile payment status
    // with Razorpay APIs/webhooks before granting access to paid content.
    res.json({ verified: true, paymentId: razorpay_payment_id });
  } catch (err) { console.error("Verify payment error:", err.message); res.status(500).json({ error: "Could not verify payment." }); }
});
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, () => console.log(`CinePass server running on port ${PORT}`));
