# Total Squad Invoice

An invoicing app for Total Squad Computer Services.

## Features

- Customer and item catalogue management
- Quotations with conversion to invoices
- Invoices, discounts and configurable tax
- Partial payments and outstanding balances
- Printable invoices and quotations (use Save as PDF in your browser)
- Business settings and JSON backup/restore
- Persistent Cloudflare D1 storage with optimistic concurrency checks

## Live app

https://total-squad-invoices.pmatengum.chatgpt.site

The live app is private. This public repository starts with blank business records and excludes customer invoices, payment history, bank account details and local databases. Data entered in the live app is not synchronised to this repository.

## Technology

React, TypeScript, Vinext, Cloudflare Workers, D1 and Drizzle migrations. Requires Node.js 22.13 or newer.

## Local development

1. Run `npm ci`.
2. Run `npm run build` to generate the local Worker configuration.
3. Initialise the local database:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_military_king_bedlam.sql
```

4. Run `npm run dev` and use the URL printed in the terminal.
5. Run `npx tsc --noEmit` and `npm run build` to verify source changes.

## Hosting

The source retains the existing private Sites hosting identity in `.openai/hosting.json`. It requires a D1 binding named `DB`, with migrations applied before serving requests. The live app relies on the hosting platform's owner-only access gate; do not deploy this shared-business database to an unprotected public endpoint. Separate hosting requires configuring authentication, database bindings and deployment infrastructure. GitHub Pages alone cannot run the Worker API or database.

## Business setup

Open Settings to enter bank details, address and default document terms. Add customers and items, then create quotations or invoices. Record payments manually; this app does not process payments or send email.

## Website

https://www.totalsquads.com
