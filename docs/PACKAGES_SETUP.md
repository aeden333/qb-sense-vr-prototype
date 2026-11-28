# Packages: setup

QB Sense VR unlocks features by package:

| Package | Unlocks |
|---|---|
| No package (signed in) | Results and progress, plus 3 free sessions of the 2D drills |
| Starter ($20/month) | All 2D drills, the 2D Two-Minute Drill, playbook uploads (with AI conversion), results and progress |
| QB Pro ($30/month) | Everything in Starter, plus the 3D drills: Read & Throw, 3D Pocket Pressure, the 3D Two-Minute Drill |
| Coach & Team ($75/month) | Everything in QB Pro, plus VR (Live Training, Coach Mode) and Players (follow and coach tracking: coming soon) |

How it works:

1. A signed-in player picks a package on the Pricing page. The Stripe checkout link carries their account id.
2. After payment, Stripe calls `api/stripe-webhook.js`. It checks Stripe's signature, then saves the package on
   the player's Firebase account (a custom claim: `plan` = `starter`, `pro` or `team`).
3. Upgrades, cancellations and failed payments call the webhook again, which updates or removes the package.
4. Every page loads `plan-gate.js`, which reads the package and locks what it does not include.
   AI playbook conversion (`api/convert-play.js`) also checks the package on the server.

The locks in the pages stop normal use. A page's files can still be opened directly by someone technical, so
anything that costs money is checked on the server as well.

## One-time setup (do these yourself; never put keys in the code or in chat)

Everything below is in **Stripe test mode** first. Repeat it in live mode when you are ready to take real payments.

### 1. Firebase service account

1. Firebase console > Project settings > Service accounts > **Generate new private key**. A JSON file downloads.
2. Keep that file private. You paste its contents into your server host in step 4, then you can delete the file.

### 2. Stripe webhook

1. Stripe dashboard > Developers > **Webhooks** > Add endpoint.
2. Endpoint URL: `https://YOUR-SITE/api/stripe-webhook` (the same site where `/api/convert-play` works).
3. Events to send: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Save, then copy the **Signing secret** (starts with `whsec_`).

### 3. Stripe key for the server

Stripe dashboard > Developers > API keys > **Create restricted key** with:
- Subscriptions: **Write**
- Everything else: None

Copy the key (starts with `rk_test_`).

### 4. Server settings (environment variables)

On your server host (where `api/convert-play.js` runs, for example Vercel > Project > Settings > Environment
Variables), add:

| Name | Value |
|---|---|
| `STRIPE_WEBHOOK_SECRET` | the signing secret from step 2 |
| `STRIPE_SECRET_KEY` | the restricted key from step 3 |
| `FIREBASE_SERVICE_ACCOUNT` | the whole contents of the JSON file from step 1 |

Redeploy so the new settings take effect.

### 5. Payment links: prices, and coming back to the site after paying

The payment links must charge the package prices: Starter $20, QB Pro $30, Coach & Team $75 per month. A Stripe
payment link's price cannot be edited, so create a new link for any price that changed and put its URL in
`pricing-checkout.js` (the `plans` list).

For each of the three payment links (Starter, QB Pro, Coach & Team): Stripe dashboard > Payment links > the link >
**After payment** > Don't show confirmation page > redirect to:

`https://YOUR-SITE/index.html?checkout=success`

The site then waits a few seconds for the webhook and unlocks the package.

### 6. Customer portal (change or cancel)

1. Stripe dashboard > Settings > Billing > **Customer portal** > activate it, and allow switching between the
   three products and cancelling.
2. Copy the portal **login link** and put it in `pricing-checkout.js` as `PORTAL_LINK`.

Players who already have a package are sent there instead of starting a second subscription.

## Keep in mind

- The webhook knows the package by its monthly price: 2000, 3000 or 7500 cents ($20, $30, $75). If you change a price, change
  `PLAN_BY_AMOUNT` in `api/stripe-webhook.js` to match.
- After a change on the account, a page picks up the new package on its next sign-in refresh (within an hour), or
  right away after checkout.
- Testing on your own computer: on `localhost` only, set `localStorage.qbsense_test_plan` to `none`, `starter`,
  `pro` or `team` in the browser console to try each package without paying.
