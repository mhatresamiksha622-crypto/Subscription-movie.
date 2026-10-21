# CinePass — Movies, Trailers & Payments

## Included
- Hindi/Marathi movie search via TMDB
- Movie details, posters, ratings, genres and available YouTube trailers
- Basic/Standard/Premium plan selector
- Razorpay Checkout integration with server-created order and server-side signature verification
- Existing dark/purple login styling retained in this starter

## Run locally
1. Install Node.js 18 or newer.
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Add your TMDB Read Access Token and Razorpay keys to `.env`.
6. Run `npm start` and open `http://localhost:3000`.

## TMDB
Request a TMDB API key/token from your TMDB account and put the Read Access Token in `.env`. See:
https://developer.themoviedb.org/docs/authentication-application
https://developer.themoviedb.org/docs/search-and-query-for-details

This product uses the TMDB API but is not endorsed or certified by TMDB. Follow TMDB attribution and usage terms. For a commercial subscription service, confirm that you have the appropriate rights/licence for your intended use.

## Razorpay: do not skip these steps
1. Create/verify the merchant account with the account holder's consent and complete any required onboarding.
2. First use Razorpay Test Mode keys to test the flow.
3. Put the Key ID and Key Secret in server environment variables only. NEVER put the Key Secret in `index.html`, client JavaScript, or a public GitHub repository.
4. Deploy this Node server to a host that supports server-side code and environment variables. GitHub Pages is static hosting and cannot run `server.js`; a static-only deployment will not make payments live.
5. Once integration is tested and your merchant account is approved, use Live Mode keys in the server's private environment variables.
6. For production, add a database for orders/subscriptions, webhook signature verification, payment-status reconciliation, cancellation/refund handling, privacy policy, terms and support details before granting paid access.

The server verifies the Checkout signature, but this starter does not yet persist subscriptions or reconcile payment status using webhooks. Do not treat the frontend callback alone as proof of a captured payment. Do not grant premium access until production payment reconciliation is implemented.

## Movie streaming note
TMDB provides metadata and trailers, not rights to stream full movies. The site shows available YouTube trailers only. To stream full movies, use content you own or have licensed.
