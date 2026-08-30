# Rolequiry Design System

This document is the canonical visual contract. Earlier generated concept art
was used only during exploration and is intentionally not shipped or required to
reproduce the interface.

## 1. Atmosphere & Identity

Rolequiry is a candidate due-diligence dossier: calm, precise, and investigative.
It should feel like an intelligence brief with a visible reasoning trail, not a
generic analytics dashboard. The product identity combines an ink-black compass
mark, serif display names, compact evidence symbols, and a monochrome
investigation spine.
Company identity uses the company logo when trusted data exists, then a verified
favicon, and otherwise a deterministic initials monogram. The current data model
has no trusted company website, so the monogram is the correct shipped fallback.

## 2. Color

- Canvas: `#f7f7f5`; primary surface: `#ffffff`; quiet surface: `#f3f3f1`.
- Ink: `#111111`; secondary ink: `#4b4b4b`; muted ink: `#767676`.
- Border: `#dededb`; strong border: `#c8c8c3`.
- Brand and focus: ink black `#181818`; selected surface: `#efefec`.
- Supported: `#157451` on `#e5f5ed`.
- Challenged: `#c23c4c` on `#fdebed`; this denotes tension, never falsity.
- Material ambiguity: ink black on `#efefec`.
- Unverified: `#667085` on `#eef0f4`.
- Evidence source accents: employer green and public amber; interview is neutral.
- Status must always include text and/or an icon; color is never the only signal.

## 3. Typography

- Product and company display names: `ui-serif, Georgia, Cambria, serif`, weight
  600. Use sparingly for identity and the case title.
- Interface copy: `ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI",
  sans-serif`.
- Page title: 32–44px responsive. Section title: 17–20px. Body: 14–16px.
- Metadata and labels: 11–13px, medium weight; uppercase only for short status
  labels, with restrained tracking.
- Evidence prose stays readable and sentence-cased; never compress it into tiny
  uppercase text.

## 4. Spacing & Layout

- Use a 4px base unit. Common gaps are 8, 12, 16, 24, and 32px.
- The workspace is centered at a maximum width of 1440px with 16px mobile,
  24px tablet, and 32px desktop gutters.
- Desktop uses a 56/44 Claim Board to Decision Path split. Tablet stacks the
  Decision Path above the board. Mobile is a single column with compact cards.
- The dossier header is one continuous surface with identity on the left and
  case metrics below or alongside it. It must not imply navigation that does not
  exist.
- Claim cards use a four-part rhythm: semantic icon, claim copy, status/priority,
  evidence signals. On narrow screens these wrap without horizontal scrolling.

## 5. Components

- `CompanyMark`: deterministic one- or two-letter monogram with accessible text.
- `StatusBadge`: icon, human-readable label, and semantic tone for Supported,
  Challenged, Material ambiguity, and Unverified.
- `ClaimIcon`: semantic SVG selected from ownership, travel, compensation,
  on-call, location, customer, and a neutral fallback.
- `PriorityControl`: native select. Imported/unset claims render a real empty
  value labelled “Set priority”; selected values render Low through Critical.
- `EvidenceSignals`: Employer, Public, and Interview symbols with counts and
  short accessible labels. Zero items are `empty`; present but non-resolving
  evidence is `neutral`, using the same gray palette without implying absence.
- `ClaimCard`: quote-led dossier row. Unset imported cards use a dashed neutral
  treatment without reducing text contrast. The active probe uses a black label
  and stronger border, and unset cards explicitly say “Not in ranking yet”.
- `DecisionPath`: ordered investigation spine. The selected claim is prominent;
  the final “Ask next” node is the action focal point.
- `EvidenceList`: grouped source entries inside native `details` disclosure.
- `DemoControls`: native `details`, visually secondary to the product workspace.

## 6. Motion & Interaction

- Motion is functional and brief: 140–180ms color, border, opacity, and transform
  transitions for hover, focus, and selection feedback.
- Do not animate layout or the investigation spine continuously.
- Respect `prefers-reduced-motion: reduce` by removing nonessential transitions.
- Interactive targets are at least 44px on touch layouts. Native select and
  details behaviors are retained for keyboard and assistive-technology support.
- Focus is visible with a 2px ink outline and offset; hover is never the only
  indication of interactivity.

## 7. Depth & Surface

- Surfaces use 14–24px radii, subtle cool-gray borders, and restrained shadows.
- The case header is the deepest surface; cards use one low elevation. Avoid
  nested shadows and glass effects.
- The Decision Path is connected by a 2px ink-gray line and circular icon nodes,
  creating hierarchy through shape and position rather than extra color.
- Do not ship the concept-art mountain as decorative imagery: it is not a trusted
  product asset and would compete with the case data. A quiet grayscale radial wash
  supplies depth without inventing employer identity.

## 8. Accessibility Constraints & Accepted Debt

- WCAG AA contrast is required for text, controls, focus states, and status
  labels. Cards remain understandable in grayscale.
- Heading order is linear; each claim is an article with a labelled priority
  control. Dynamic case selection uses existing live state without forced focus.
- External evidence URLs are restricted to HTTP(S) and announce that they open in
  a new tab through their accessible label.
- At 200% zoom and 375px width, content must reflow without horizontal scrolling.
- Accepted debt: actual company logos/favicons are deferred until the import
  contract supplies a trusted company website or logo URL. Monograms prevent
  broken images and avoid untrusted remote fetches in the current release.
