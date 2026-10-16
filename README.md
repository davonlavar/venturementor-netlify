# VentureMentor AI — Netlify-ready starter

A BoodleBox-inspired, entrepreneur-focused AI business mentor built with React + Vite and a Netlify Function. The UI includes conversation history, startup guidance shortcuts, text-based file attachments, and export/print-to-PDF options.

## Features in this starter

- Guided first interaction that assesses the business idea, industry, stage, and support needs.
- Focused prompts for business plans, market research, financial planning, legal/admin checklists, marketing, a 90-day roadmap, resources, and progress tracking.
- System prompt asks for industry-specific, actionable advice, clear assumptions, inclusive examples, and professional disclaimers for legal/tax/investment topics.
- Multiple conversations saved in the current browser using localStorage.
- Text/Markdown/CSV/JSON/HTML/XML attachment reading (up to 1 MB per file, 12,000 characters per file; max 4 attachments at a time). Other file types are listed but not parsed in this MVP.
- Export conversation as text, a Word-compatible `.doc`, or use the browser print dialog to save as PDF.
- Netlify serverless function keeps the OpenAI API key on the server, not in the browser.
- Responsive desktop/mobile interface.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

The chat endpoint is a Netlify Function, so for full local testing use the Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev
```

Set `OPENAI_API_KEY` in your local shell or in a local `.env` file (never commit it). Optional: set `OPENAI_MODEL` to a model enabled for your account.

## Deploy to Netlify

1. Put this project in a GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project** and connect the repository.
3. Netlify should read `netlify.toml`; confirm build command `npm run build`, publish directory `dist`, and functions directory `netlify/functions`.
4. In **Site configuration → Environment variables**, add `OPENAI_API_KEY` with your secret API key. Optionally add `OPENAI_MODEL`.
5. Deploy or trigger a fresh deploy after setting environment variables.
6. Open the deployed URL and send a test message. If the app reports the AI service is not configured, verify the environment variable and redeploy.

You can also deploy using Netlify CLI from the project folder:

```bash
npm install
npm install -g netlify-cli
netlify login
netlify init
netlify env:set OPENAI_API_KEY
netlify deploy --build
netlify deploy --build --prod
```

The CLI may prompt you for the key value. Do not paste secrets into chat or commit them to Git.

## Current limitations / production checklist

This is a deployable MVP, not a complete SaaS clone. Account sign-in, persistent cross-device cloud history, team workspaces, usage limits, subscriptions/billing, server-side file parsing for PDF/DOCX, document-generation files, and admin analytics are not connected. Conversation history currently lives only in the visitor's browser and can be removed by clearing local storage. Before charging customers, add authentication (e.g. Supabase Auth or another provider), database policies, server-side authorization, abuse prevention/rate limits, billing webhooks, privacy/retention disclosures, and a cost-control strategy. Never rely on client-side checks for paid access. Review provider data-handling policies before accepting sensitive business documents.

## Suggested next release

1. Add Supabase Auth and Postgres for accounts and cross-device conversations.
2. Add Stripe Checkout + verified webhooks for subscriptions and entitlements.
3. Add file extraction for PDF/DOCX and size/type scanning.
4. Generate polished `.docx` and PDF business plans server-side.
5. Add per-user rate limits, spend monitoring, feedback, and a privacy/terms page.
