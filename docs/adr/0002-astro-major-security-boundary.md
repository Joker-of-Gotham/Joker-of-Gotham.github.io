# ADR-0002: Keep the redesign on Astro 5 and gate the Astro 7 security migration

- **Status:** Accepted temporarily; release follow-up required
- **Date:** 2026-08-28
- **Owner:** Joker-of-Gotham
- **DRI for this implementation:** Codex
- **Risk / quality:** S2 · QA-L3

## Context

The approved work is a visual-system and interaction redesign of an existing Astro 5 static site. A dependency audit performed during implementation initially reported 35 advisories, including one critical advisory in the local CMS toolchain. The repository also had old compatible-minor versions of Astro, Mermaid, Decap Server, and several transitive packages.

The currently published fixes for the remaining Astro advisories require Astro 7. That change crosses two framework major versions and can affect content collections, integrations, client navigation, build output, and the CMS workflow. Applying `npm audit fix --force` inside the visual redesign would therefore combine two independently risky changes and make regression attribution unreliable.

## Decision

1. Update all reviewed dependencies that remain within the current major-version contracts:
   - Astro `5.18.2`
   - `@astrojs/mdx` `4.3.14`
   - Mermaid `11.17.2` with DOMPurify `3.4.14`
   - Decap Server `3.10.0` with simple-git `3.36.0`
   - Vite `6.4.3`, PostCSS `8.5.26`, and the other non-breaking transitive fixes selected by the reviewed `npm audit fix --dry-run`
2. Do not run `npm audit fix --force` and do not silently migrate to Astro 7 in this redesign.
3. Keep deployment static-only. Do not introduce SSR, server islands, user-controlled `define:vars`, dynamic untrusted attribute names, or dynamic untrusted slot names while this ADR is active.
4. Bind local development and preview services to loopback unless a human explicitly authorizes broader exposure.
5. Treat the Astro 7 migration as a separate engineering work object with its own compatibility matrix and regression pass before claiming that the repository has no known high-severity dependency advisories.

## Evidence actually collected

- `npm audit` after the non-breaking updates: 4 advisories remain (2 low, 2 high), all attributed to the Astro 5 dependency path; the previous critical simple-git advisory is gone.
- `npm audit fix --dry-run` was reviewed before applying the non-force update.
- Decap Server `3.10.0` started successfully on local port 8081 and was then stopped; the command output did not expose the bind address, so loopback-only binding remains a deployment configuration requirement rather than a verified result.
- This repository's Astro output mode is `static` in the production build configuration.

These checks do not prove that the remaining advisories are unexploitable. They establish the current dependency state and the chosen risk boundary.

## Consequences

### Positive

- Removes the critical local-CMS advisory and the compatible Mermaid/DOMPurify and transitive issues without destabilizing the approved redesign.
- Preserves a reviewable scope and a functioning Astro 5 content/CMS pipeline.

### Negative

- The dependency graph still reports known Astro-path advisories.
- A separate Astro 7 migration and full regression pass are required.

## Exit criteria

Supersede this ADR only after all of the following are actually completed:

1. Astro and its integrations are migrated to a version outside the affected advisory ranges.
2. Content collections, Pagefind, Decap CMS, KaTeX, Mermaid, client routing, all static routes, and the observatory renderer pass the repository verification suite.
3. `npm audit --omit=dev` and full `npm audit` results are recorded, with every remaining item explicitly accepted or remediated.
