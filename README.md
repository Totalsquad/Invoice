# Total Squad Invoice

Standalone invoicing app with email/password login, customers, items, quotations, invoices, payment records, printable documents and backup/restore. Runs on your Cloudflare account, independently of ChatGPT. Source code stays on GitHub.

## Deploy from Cloudflare

1. In Cloudflare, open **Storage & databases → D1 SQL database** and create a database named `total-squad-invoice`.
2. Copy its Database ID into `wrangler.jsonc`, replacing the zero placeholder, and commit that change.
3. Open **Workers & Pages → Create application → Import a repository** and select `Totalsquad/Invoice`.
4. Set the Worker name to `total-squad-invoice`, production branch to `main`, build command to `npm run build`, and deploy command to `npm run deploy`. Use Node.js 22 or newer.
5. Deploy. The deploy script applies D1 migrations before publishing the built Worker. The build/deploy identity needs permission to edit this Worker and D1 database.
6. In the deployed Worker's **Settings → Variables and Secrets**, add a **Secret** named `SETUP_KEY` containing a long random value you choose. Apply the change/deploy it.
7. Open the Worker URL. Enter your email, a password of at least 12 characters, and the setup key to create the single owner account. No ChatGPT login is involved.
8. Remove the `SETUP_KEY` secret after creating your owner account. Existing accounts cannot be replaced through setup.
9. Optionally add `invoice.totalsquads.com` under the Worker's **Settings → Domains & Routes → Add → Custom domain** if the domain is managed in this Cloudflare account.

Never add passwords, setup keys, API tokens, database exports or real customer records to this public repository.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run build
npx wrangler d1 migrations apply DB --local --config wrangler.jsonc
```

Create an untracked `.dev.vars` file containing `SETUP_KEY="your-local-setup-key"`, then run `npm run dev`. Open the URL printed in the terminal. Production secrets are separate from local settings.

```bash
npx tsc --noEmit
npm run build
```

## Authentication

Passwords use salted PBKDF2-SHA256 hashes with 100,000 iterations. Random session tokens are stored hashed in D1. Cookies are HttpOnly, SameSite=Strict, and Secure over HTTPS. Sessions expire after seven days. Write endpoints require same-origin requests and an authenticated session. Login/setup attempts are limited per IP to ten per 15-minute time bucket. This is a single-owner workspace; registration closes after setup. There is no email-based password recovery yet; keep your password in a password manager.

## Business setup and data

Open Settings to enter bank details, address and default terms. Add customers/items, then create quotations or invoices. Record payments manually; this app does not process payments or send email. Use Print / PDF to save a document through your browser.

The repository starts with blank records. The previous ChatGPT-hosted app and your Cloudflare deployment have separate databases. To transfer records, download a backup from the previous app and restore it in the new app after signing in. Download regular backups from Settings.

## Website

https://www.totalsquads.com
