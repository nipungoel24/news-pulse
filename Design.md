# Design.md

## Visual direction
A broadsheet masthead on warm newsprint. Black-ink type, hairline rules, one oxblood signal for live/selection. The Coverage Window reads like a newsroom story-map: four source lanes with article events as dots on a shared time axis, cluster connections as cross-lane bands on hover/selection.

## Tokens
### Colors
- background: paper `#F1ECE3`
- surface: paper-raised `#F7F3EB`
- text: ink `#1C1915`
- muted: ink-muted `#5C564C`
- border: rule `#D4CCC0`
- focus: oxblood `#9C2B1A`
- primary: oxblood `#9C2B1A`
- success: forest `#2F6B4F`
- warning: bronze `#8A5A2B`
- error: oxblood `#9C2B1A`

Source lane colors: BBC `#2c4a62`, NPR `#2f4a3c`, Guardian `#4a4e3a`, Al Jazeera `#5a3d32`.
Cluster highlight: oxblood `#9C2B1A`.

### Typography
- display: Fraunces (masthead, cluster labels)
- body: Figtree
- mono: ui-monospace for timestamps
- heading scale: masthead ~3rem, section ~1.5rem
- body scale: 16px / 1.5

### Layout
- max width: 1120px
- mobile gutter: 16px
- section spacing: 24–48px
- breakpoints: 390 / 768 / 1100

### Shape
- control radius: 4px
- card radius: 8px
- large radius: 12px (sheet only)

### Elevation
- Hairline rules over shadows. One soft shadow on the cluster sheet.

## Components
- Button: rectangular, ink outline or oxblood solid
- Source filter: toggle buttons with a bottom rule when on
- Coverage Map: source lanes (72px each), article event dots (12px default, 16px active), SVG cluster bands
- Cluster Detail Sheet: paper surface, article list
- Skeleton: rule-colored pulse
- Empty/error: plain ink copy, retry control

## Icons
- UI icon source: lucide-react
- Morphicons: not required
- theSVG: not used (no licensed outlet marks; source names are typeset)

## Motion
- Sheet open 250ms / close 150ms, opacity + translate
- Dot hover: scale + opacity, 150ms ease-out
- Cluster band fade: 150ms
- Reduced motion: instant state, no pulse on live dot

## Content
Specific, concise, truthful. Attribution always names the outlet. No emoji. No em dashes.
