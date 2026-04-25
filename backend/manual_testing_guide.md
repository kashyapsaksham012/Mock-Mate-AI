# Manual Testing Guide (CURL)

Use these raw `curl` commands to verify your backend implementation. No scripts or external tools are required except for `curl`.

> [!IMPORTANT]
> **Authentication**: You must replace `<CLERK_JWT_TOKEN>` with a valid JWT from your frontend session.
> **Stripe Webhook**: Mocking the webhook manually via `curl` will fail signature verification. For local testing, use the **Stripe CLI** as described below.

---

### 1. Health & Configuration Check
Verify the server is running and the configuration is valid.
```bash
curl http://localhost:5000/health
```

### 2. Verify Authentication (User Profile)
Verify that the `requireAuth` middleware correctly identifies you via Clerk.
```bash
curl -X GET http://localhost:5000/api/user/me \
     -H "Authorization: Bearer <CLERK_JWT_TOKEN>"
```

### 3. Initiate Checkout Session
Create a Stripe Checkout URL for the "Pro Monthly" plan.
```bash
curl -X POST http://localhost:5000/api/payment/create-checkout-session \
     -H "Authorization: Bearer <CLERK_JWT_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"planType": "pro_monthly"}'
```

### 4. Check Subscription Status
Verify the calculated `isActive` status and plan details.
```bash
curl -X GET http://localhost:5000/api/subscription/status \
     -H "Authorization: Bearer <CLERK_JWT_TOKEN>"
```

---

### 5. Simulate Stripe Webhook (Local Testing)
Since manual `curl` cannot generate a valid `stripe-signature`, use the official Stripe CLI to relay real events to your local endpoint.

**A. Start the tunnel:**
```bash
stripe listen --forward-to localhost:5000/api/payment/webhook
```

**B. Trigger the event (In a separate terminal):**
```bash
stripe trigger checkout.session.completed
```

---

### Expected Results
- **Status 200 OK**: For all valid requests.
- **Status 401 Unauthorized**: If no token or an invalid token is provided.
- **Status 400 Bad Request**: If `planType` is missing or invalid.
- **Status 400 Webhook Error**: If you attempt to `curl` the webhook without a valid signature.
