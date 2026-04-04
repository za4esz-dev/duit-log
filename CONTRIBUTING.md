# Codebase Conventions

> DuitLog is a feature-complete template. This document describes the coding conventions used throughout the project — useful if you've forked the repo and want to maintain consistency as you customize it.

## Development Setup

Follow the [Getting Started](README.md#getting-started) section in the README to set up your local environment.

## Code Style

- **TypeScript strict mode** is enabled — fix all type errors before committing.
- **Tailwind utility classes only** — no custom CSS files (except `app.css` for Tailwind directives).
- **Server-only code** goes in `.server.ts` files to ensure it never ships to the client bundle.
- **React Router conventions** — use `loader`, `action`, `useLoaderData`, `useActionData`, and `<Form>`.
- **Zod** for all input validation — define schemas in `app/lib/validation.ts`.

## Branching

Create feature branches off `master` with descriptive names:

- `feat/offline-queue`
- `fix/amount-validation`
- `docs/update-readme`

## Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add offline expense queue
fix: correct amount decimal parsing
docs: update Google Sheets setup instructions
chore: upgrade React Router to v7.13
```

## Customizing Your Fork

- Edit expense sources, categories, and payment methods in `app/lib/constants.ts`
- Update environment variables in `.env` (see `.env.example` for the template)
- Modify PWA branding in `public/manifest.webmanifest` and replace icon files
- Adjust Google Sheet column headers to match your constants

## Upstream Contributions

This project is not actively seeking contributions, but if you find a bug or have an improvement that benefits all users of the template, feel free to open an issue or PR.
