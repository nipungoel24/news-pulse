---
name: production-website
version: 1.0.0
description: Build and improve production-grade websites with deliberate design, accessible responsive UI, complete SEO/discovery metadata, truthful content, strong performance, and rigorous browser/launch QA.
---

# Production Website

Use this skill whenever building, redesigning, refactoring, auditing, or improving a public-facing website or web application surface.

This is a construction standard and a verification standard.

## Core rules

1. Inspect before changing.
2. Preserve working architecture unless a verified requirement or defect justifies change.
3. Real project facts and supplied content beat assumptions.
4. Never fabricate reviews, metrics, customers, team members, locations, awards, prices, guarantees, response times, or business claims.
5. Build one coherent design system instead of unrelated generated sections.
6. Prefer semantic HTML and accessible primitives.
7. Treat mobile as a first-class interface.
8. Use purposeful motion only.
9. Fix console/runtime errors before release.
10. Never claim a deployment, domain, integration, analytics property, or external setup is complete unless verified.

## First action: audit

Before major implementation inspect:
- framework and rendering model
- package manifest and dependencies
- routes and entry points
- existing components and design tokens
- typography and icon system
- assets
- forms and data flow
- deployment configuration
- current SEO metadata
- console and network errors
- mobile overflow
- broken links
- bundle size and source maps
- missing pages and legal pages

Create or update:
- PRD.md
- Architecture.md
- Rules.md
- Phases.md
- Design.md
- Memory.md

Work through Phases.md rather than rebuilding everything at once.

## Public HTML integrity

For public pages, use SSR, SSG, or prerendering where appropriate to the framework.

Critical content and metadata should be present in generated HTML when the architecture supports it. Inspect representative production page source. A visually correct page that is essentially an empty client-side shell is a quality defect unless there is a documented architectural reason.

## Anti-vibe-coded design

Do not use merely because generated sites commonly do:
- purple or multicolor gradients
- glowing primary buttons
- pill-shaped controls everywhere
- fake testimonials/reviews/metrics/counters
- invented logos or awards
- vague hero copy
- generic AI-slop photography
- cursor-following decoration
- excessive parallax or scroll animation
- giant animated blobs
- emoji as interface icons
- excessive glassmorphism
- arbitrary 3D effects
- giant rounded cards for every section
- placeholder copy
- framework branding in titles or UI
- "Made with AI" badges unless explicitly required
- unnecessary navigation
- em dashes in site copy

Bold or colorful design is allowed when it is justified by the actual brand/product. The rule is intentionality.

## Content integrity

If content is unavailable:
- document the dependency
- use a neutral empty state when appropriate
- do not manufacture proof

Real reviews may be used only when supplied or attributable to a real source. LocalBusiness structured data must contain real business information.

## Required site capabilities

Unless PRD says otherwise, verify equivalents of:
- Home
- About/Team
- Services/Solutions
- Work/Case Studies
- FAQ/help
- Contact/Enquiry
- Thank-you
- Privacy Policy
- Terms and Conditions
- Custom 404

Add location content when the business has physical locations.

## Navigation and conversion

Verify:
- clear above-fold CTA
- logo links home
- phone uses tel:
- email uses mailto:
- footer links work
- internal links work
- breadcrumbs are meaningful
- mobile menu works
- sticky header works where appropriate
- sticky mobile CTA works where appropriate
- enquiry form has validation, loading, success and error states
- successful enquiry reaches a thank-you destination
- important errors are not communicated only through a disappearing toast

## Accessibility

Use:
- semantic HTML
- one clear primary H1 per page
- correct heading hierarchy
- visible focus
- keyboard navigation
- accessible names
- proper form labels
- `aria-describedby` and `aria-invalid` where needed
- correct dialog focus behavior
- skip-to-content link
- useful alt text
- reduced-motion support
- usable touch targets

Do not disable paste. Do not remove focus outlines without an equivalent visible treatment.

## Responsive/mobile

Verify:
- no horizontal scrolling
- no clipped content
- safe-area handling for fixed/sticky UI
- readable type and spacing
- correct touch behavior
- mobile navigation
- hover effects only on hover-capable devices
- appropriate viewport units
- sticky CTA does not cover content

Prefer capability-based media queries over device sniffing.

## Components and libraries

Prefer the project's existing design system. Do not add duplicate UI libraries without a clear reason.

Use shadcn/ui primitives when appropriate and compatible with the stack.

Use Morphicons for meaningful state-to-state icon transitions, not decoration.

Use theSVG for real brand/vendor marks where appropriate and respect applicable trademark/licensing requirements.

Use upstream specialist skills selectively when available:
- ibelick/ui-skills: baseline UI, accessibility, metadata, motion/performance
- emilkowalski/skills: design engineering, animation, mobile-native behavior, UI library selection

## Motion

Animation must communicate state, hierarchy, feedback, continuity, or disclosure.

Prefer transform/opacity and compositor-friendly properties.

Avoid:
- `transition: all`
- layout-property animation
- `scale(0)` entrances
- excessive bounce
- long blocking transitions
- motion that persists despite reduced-motion preferences

## SEO/discovery

Every public indexable page should have:
- unique title
- unique meta description
- canonical URL
- Open Graph title/description/image/url
- appropriate Twitter/X metadata
- favicon
- correct `html lang`

Create:
- `robots.txt`
- `sitemap.xml`
- `llms.txt` where applicable

Do not accidentally block public crawlers. Do not use noindex unless intentional.

Use structured data only for truthful information represented by the site:
- Organization
- LocalBusiness
- BreadcrumbList
- WebSite
- FAQPage where genuinely applicable
- Service/Product where genuinely applicable

## Images/assets

Prefer real assets.

Informative images require meaningful alt text. Decorative images should use empty alt text. Optimize dimensions, format, and loading behavior. Never use fabricated people/customer imagery as proof.

## Performance

Before release:
- inspect production bundles
- split expensive features where useful
- optimize images
- remove redundant dependencies
- remove dead code
- fix hydration/runtime warnings
- avoid unnecessary client-side rendering
- test slow-network behavior
- do not publicly expose source maps by default

If source maps are needed for monitoring, upload them privately through the monitoring workflow rather than serving them publicly.

## Runtime/browser QA

Test every critical route and flow:
- direct route navigation
- navigation/header/footer
- CTAs
- forms
- validation
- success/error states
- thank-you page
- custom 404
- mobile menu
- breadcrumbs
- copy controls
- password visibility
- console
- failed network requests

Run a link crawl and verify deep links.

## Launch gate

Do not declare complete until verified:
- custom domain
- HTTPS
- canonical host/redirects
- favicon
- unique titles/descriptions
- canonicals
- OG/social images
- lang
- H1 structure
- alt text
- internal/footer links
- custom 404
- privacy and terms
- analytics only if intentionally configured
- maps/directions when applicable
- real reviews/team/case studies only when supplied
- robots/sitemap/llms
- structured data
- no public source maps
- reasonable production bundles
- clean console
- clean critical network requests
- no placeholders
- no scaffold branding
- meaningful page source

If an external setup cannot be completed, record the blocker. Never fake completion.

## Continuous improvement

When a new recurring failure is discovered:
1. Decide whether it is a reusable engineering rule.
2. If yes, update this skill or a supporting reference/checklist.
3. Avoid duplicating existing rules.
4. Update CHANGELOG.md.
5. Commit with a clear message.
6. Do not weaken an existing rule without documenting why.

GitHub is the canonical source of truth for this skill.
