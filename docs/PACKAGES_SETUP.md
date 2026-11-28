# Packages: setup

QB Sense VR unlocks features by package:

| Package (account code) | Unlocks |
|---|---|
| No package (signed in) | Results and progress, plus 3 free sessions of the 2D drills |
| Rookie, $20/month (`starter`) | All 2D drills, the 2D Two-Minute Drill, playbook uploads (with AI conversion), results and progress |
| Varsity, $30/month (`pro`) | Everything in Rookie, plus the 3D drills: Read & Throw, 3D Pocket Pressure, the 3D Two-Minute Drill |
| All-Pro, $75/month (`team`) | Everything in Varsity, plus VR (Live Training, Coach Mode) and Players (follow and coach tracking: coming soon) |
| Coach & Team (quote) | Quote only: coaches request one on the Pricing page. Give a quoted group the `team` code |

The account codes stay `starter`, `pro` and `team` whatever the packages are called, so renaming a package
never affects anyone who already has it.

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

The payment links must charge the package prices: Rookie $20, Varsity $30, All-Pro $75 per month. A Stripe
payment link's price cannot be edited, so create a new link for any price that changed and put its URL in
`pricing-checkout.js` (the `plans` list).

For each of the three payment links (Rookie, Varsity, All-Pro): Stripe dashboard > Payment links > the link >
**After payment** > Don't show confirmation page > redirect to:

`https://YOUR-SITE/index.html?checkout=success`

The site then waits a few seconds for the webhook and unlocks the package.

### 6. Customer portal (change or cancel)

1. Stripe dashboard > Settings > Billing > **Customer portal** > activate it, and allow switching between the
   three products and cancelling.
2. Copy the portal **login link** and put it in `pricing-checkout.js` as `PORTAL_LINK`.

Players who already have a package are sent there instead of starting a second subscription.

### 7. Coach & Team quote requests (Firestore rule)

The "Request a quote" form saves each request in Firestore, in the `quoteRequests` collection. Add this block
inside `match /databases/{database}/documents { ... }` in Firebase console > Firestore > **Rules**, then Publish:

```
match /quoteRequests/{id} {
  // A signed-in user can send a request for their own account, with exactly these fields.
  allow create: if request.auth != null
    && request.resource.data.uid == request.auth.uid
    && request.resource.data.keys().hasOnly(['uid', 'name', 'email', 'organization', 'quarterbacks', 'message', 'createdAt'])
    && request.resource.data.name is string && request.resource.data.name.size() > 0 && request.resource.data.name.size() <= 100
    && request.resource.data.email is string && request.resource.data.email.size() <= 200
    && request.resource.data.organization is string && request.resource.data.organization.size() > 0 && request.resource.data.organization.size() <= 150
    && request.resource.data.quarterbacks is int && request.resource.data.quarterbacks >= 1 && request.resource.data.quarterbacks <= 1000
    && request.resource.data.message is string && request.resource.data.message.size() <= 2000
    && request.resource.data.createdAt == request.time;
  // Nobody reads, changes or deletes requests from the site; you read them in the Firebase console.
  allow read, update, delete: if false;
}
```

To read requests: Firebase console > Firestore > Data > `quoteRequests`. Each has the coach's name, email,
organization, number of quarterbacks, message and the time it was sent.

To give a quoted group access: send them a Stripe payment link for the price you quote, on the All-Pro product.
The webhook only knows the three standard prices, so for a
custom price add its amount (in cents) to `PLAN_BY_AMOUNT` in `api/stripe-webhook.js`, mapped to `team`.

## Keep in mind

- The webhook knows the package by its monthly price: 2000, 3000 or 7500 cents ($20, $30, $75). If you change a price, change
  `PLAN_BY_AMOUNT` in `api/stripe-webhook.js` to match.
- After a change on the account, a page picks up the new package on its next sign-in refresh (within an hour), or
  right away after checkout.
- Testing on your own computer: on `localhost` only, set `localStorage.qbsense_test_plan` to `none`, `starter`,
  `pro` or `team` in the browser console to try each package without paying.
