# Web (@speakmemo/web) Codemap

**Last Updated:** 2026-02-28
**Status:** PLANNED - Landing page application (not yet implemented)

## Overview

The `@speakmemo/web` application will serve as the public landing page and marketing site for speakmemo. It will be deployed separately from the main SaaS app and is currently in the planning phase.

## Architecture (Planned)

```
@speakmemo/web (Landing Page)
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Homepage
│   │   ├── pricing/page.tsx  # Pricing page
│   │   ├── blog/
│   │   │   ├── page.tsx      # Blog index
│   │   │   └── [slug]/page.tsx # Individual posts
│   │   └── api/
│   │       └── [...routes]   # API for contact forms, etc.
│   ├── components/           # React components
│   └── types/               # TypeScript types
├── next.config.ts
├── package.json
└── tsconfig.json

External:
├── Next.js 16
├── @repo/ui (Shared components)
└── SEO/Analytics tools
```

## Planned Routes

| Route          | Purpose          | Components             | Status      |
| -------------- | ---------------- | ---------------------- | ----------- |
| `/`            | Landing page     | Hero, features, CTA    | Not Started |
| `/pricing`     | Pricing plans    | Plan cards, comparison | Not Started |
| `/blog`        | Blog index       | Post list, pagination  | Not Started |
| `/blog/[slug]` | Individual post  | Article, comments      | Not Started |
| `/contact`     | Contact form     | Form, validation       | Not Started |
| `/privacy`     | Privacy policy   | Static content         | Not Started |
| `/terms`       | Terms of service | Static content         | Not Started |

## Design Direction

Per [Landing Page Spec](../landing-page.md):

- Modern, minimalist design
- Mobile-first responsive layout
- Dark/light mode support (via next-themes)
- SEO optimized (metadata, structured data)
- Performance focused (images optimized, lazy loading)

## Technology Stack

Same as `@speakmemo/app`:

- **Framework:** Next.js 16
- **Language:** TypeScript 5.7
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Components:** @repo/ui shared library
- **Fonts:** Pretendard Variable (local)

## Development Setup

```bash
# Will be similar to main app
pnpm dev                    # Start dev server (port 3001)
pnpm build                  # Production build
pnpm lint                   # ESLint check
pnpm typecheck             # Type checking
```

## Configuration

Similar to `@speakmemo/app`:

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Planned Features

1. **Hero Section** - Main value proposition
2. **Features Overview** - Core benefits (STT, AI structuring, etc.)
3. **Testimonials** - User feedback/reviews
4. **Pricing Tiers** - Free, Pro, Enterprise options
5. **Blog** - Company blog, product updates
6. **Newsletter** - Email signup
7. **Contact Form** - Sales inquiries
8. **Analytics** - Google Analytics, Mixpanel

## Deployment

- Hosted on Vercel (same as main app)
- Separate domain or subdomain
- CDN for static assets
- Automatic deployments from main branch

## Content Management

TBD - Options:

- Static markdown files (in repo)
- CMS (Contentful, Sanity, etc.)
- Headless CMS integration

## SEO & Analytics

- OpenGraph metadata for social sharing
- Structured data (JSON-LD) for rich snippets
- Sitemap generation
- Analytics tracking (Google Analytics, Mixpanel)
- Performance monitoring (Core Web Vitals)

## Related Areas

- **[README.md](../../README.md)** - Getting started, tech stack overview
- **[Landing Page Spec](../landing-page.md)** - Detailed design and content planning
- **[Branding Guide](../branding.md)** - Brand voice, tone, visual identity
- **[@repo/ui](./UI.md)** - Shared components for landing page

---

## Status

**PLANNED** - Design phase, awaiting implementation after MVP completion

## Next Steps

1. Finalize landing page content and design (per spec)
2. Create wireframes/mockups
3. Set up Next.js project structure
4. Implement hero, features, pricing pages
5. Add blog functionality
6. Integrate analytics and forms
7. Deploy to staging/production
