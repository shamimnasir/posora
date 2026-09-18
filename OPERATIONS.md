# Posora release runbook

## Pre-release checks

```bash
npm ci
npm run check
npm run audit
npm run test:smoke
npm run build
```

The smoke suite checks the public routes at mobile, tablet and desktop sizes,
including reduced-motion mode. It also catches horizontal overflow on mobile.

## Digital-pack release

1. Generate and visually inspect the PDFs: `npm run digital-packs`.
2. Upload the ১১ PDFs and `posora-digital-pack-bundle.zip` to the private R2
   bucket `posora-digital-packs` under `digital-packs/`.
3. Put SSLCommerz credentials into Worker secrets. Use sandbox mode first.
4. Set the merchant IPN URL to `https://posora.com/api/sslcommerz/ipn`.
5. Run one successful, one failed and one cancelled sandbox transaction.
6. Confirm the successful transaction creates the entitlement and that a
   signed-out request to `/api/digital-pack/download/bundle` returns `401`.
7. Set `DIGITAL_PACK_READY=true` only after the R2 files and member library
   are live. Deploy once more.
8. Repeat the tests with live credentials and keep the first live order under
   manual review.

## Rollback

```bash
npx wrangler deployments list
npx wrangler rollback <deployment-id>
```

If a payment release misbehaves, first set `DIGITAL_PACK_READY=false`; this
stops new checkout sessions while leaving already-paid entitlements readable.
Never delete the R2 files during an incident. Rotate a compromised merchant
secret with `npx wrangler secret put ...`, then redeploy.

## Monitoring

- `/api/health` is a safe uptime probe. It reports whether D1, private R2 and
  the checkout release switch are present, never credentials.
- Cloudflare Worker Observability is enabled in `wrangler.jsonc`.
- Payment callbacks and weekly mail failures use structured Worker logs; watch
  them with `npx wrangler tail posora`.

### Alerts

Create Cloudflare Notifications for the `posora` Worker with these conditions:

- Worker errors above zero for five minutes: notify the release owner.
- HTTP 5xx rate above 2% for ten minutes: page the release owner.
- `/api/health` is not 2xx for two consecutive checks: page the release owner.
- Search Worker logs for `SSLCommerz initiation failed` or `SSLCommerz validation failed` and notify the payment owner.

Keep alert destinations outside the repository. Never put email addresses,
tokens, merchant keys or webhook URLs in source control.

## GitHub deployment

`.github/workflows/deploy.yml` runs the release checks and deploys `main` with
Wrangler. Add `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit) and
`CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets before enabling it. The
workflow is push-or-manual triggered and cancels an older deployment when a
newer commit arrives.
