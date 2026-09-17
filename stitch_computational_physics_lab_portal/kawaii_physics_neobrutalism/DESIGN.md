---
name: Kawaii Physics Neobrutalism
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#43474e'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f0f1f1'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#476083'
  primary: '#000613'
  on-primary: '#ffffff'
  primary-container: '#001f3f'
  on-primary-container: '#6f88ad'
  inverse-primary: '#afc8f0'
  secondary: '#81515a'
  on-secondary: '#ffffff'
  secondary-container: '#fdbec9'
  on-secondary-container: '#7a4a54'
  tertiary: '#000802'
  on-tertiary: '#ffffff'
  tertiary-container: '#00250d'
  on-tertiary-container: '#589364'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#afc8f0'
  on-primary-fixed: '#001c3a'
  on-primary-fixed-variant: '#2f486a'
  secondary-fixed: '#ffd9df'
  secondary-fixed-dim: '#f4b6c1'
  on-secondary-fixed: '#330f19'
  on-secondary-fixed-variant: '#663a43'
  tertiary-fixed: '#b2f2bb'
  tertiary-fixed-dim: '#96d5a0'
  on-tertiary-fixed: '#00210b'
  on-tertiary-fixed-variant: '#145129'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.0'
  code-sm:
    fontFamily: Space Grotesk
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  container-max: 1280px
---

## Brand & Style

This design system merges the rigorous, analytical nature of computational physics with the energetic, accessible aesthetic of Kawaii Neobrutalism. The brand personality is "Expertly Playful"—it treats complex data with the seriousness of a laboratory but presents it with the vibrant enthusiasm of a modern creative tool.

The target audience consists of students and researchers who spend hours staring at code and simulations. The UI aims to reduce cognitive fatigue by using high-contrast boundaries, cheerful pastel accents to denote different data types, and tactile-inspired interactions that make digital physics feel physical. The emotional response is one of clarity, approachability, and "joy in discovery."

## Colors

The color palette is anchored by a deep Navy Blue used for structural elements and primary actions, ensuring the scientific context remains grounded. This is offset by a "Kawaii" trio of pastels used for categorization, highlights, and secondary UI states.

- **Primary (Navy):** Used for headers, primary buttons, and heavy borders.
- **Secondary (Pastel Pink):** Used for alerts, decorative elements, and physics "errors" or "intensity."
- **Tertiary (Pastel Mint):** Used for "success" states, stable simulation indicators, and growth metrics.
- **Quaternary (Pastel Yellow):** Used for warnings, highlighting variables, and active workspaces.
- **Backgrounds:** Stick to pure white or very light gray (#F8F9FA) to allow the bold outlines and pastel fills to pop without visual noise.

## Typography

The typography system balances character with utility. 

- **Headlines:** Use **Plus Jakarta Sans** for its friendly, rounded geometry. It should always be set with tight letter-spacing and heavy weights to match the "bold" visual style.
- **Body:** Use **Inter** for all computational data, descriptions, and instructions. It provides the necessary neutrality and legibility for long-form scientific reading.
- **Technical Labels:** Use **Space Grotesk** for button text, graph labels, and variable names. Its slightly technical, futuristic quirkiness reinforces the computational theme while remaining highly legible at small sizes.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model for simulation dashboards and a **Fluid Grid** for documentation pages. 

- **Grid:** Use a 12-column system with 24px gutters. 
- **Rhythm:** All spacing must be multiples of 4px. Use generous internal padding (min 24px) within cards to balance the aggressive thickness of the borders.
- **Alignment:** Elements should feel "chunked." Group related physics parameters into distinct card modules rather than using subtle dividers.

## Elevation & Depth

Depth in this system is strictly 2D and structural. There are no blurs or ambient gradients.

- **Hard Shadows:** Use a solid offset shadow (typically 4px to 8px) in black (#000000) or a darker tint of the primary Navy. 
- **Direction:** Shadows always cast to the bottom-right (45 degrees).
- **The "Pop" Effect:** Interactive elements move -2px or -4px on the X and Y axes on hover, while the shadow expands, creating a tactile "lifting" sensation. On click, the element translates +2px toward the shadow, appearing to be physically pressed into the page.
- **Borders:** All containers must feature a solid black border (3px default).

## Shapes

The shape language is "Squishy-Hard." While the borders are thick and the shadows are rigid, the corners are significantly rounded to maintain the Kawaii aesthetic.

- **Standard Elements:** Use 16px (1rem) for card and modal corners.
- **Small Elements:** Use 8px (0.5rem) for buttons, input fields, and tags.
- **Interactive States:** Maintain the same corner radius during hover/active states to ensure the "box" feels like a solid physical object.

## Components

### Buttons
Primary buttons use the Navy background with white text and a 3px black border. Secondary buttons use one of the three pastel colors. All buttons must feature a 4px hard black shadow that disappears or "compresses" on click.

### Cards
Cards are the primary container for physics simulations. They feature a 3px black border, 16px rounded corners, and an 8px hard shadow. Headers within cards should be separated by a 3px horizontal black line.

### Inputs & Selects
Form fields use a white background with 3px black borders. On focus, the border color remains black, but the shadow changes to the Pastel Pink or Mint to indicate activity.

### Vibrant Alerts
Alerts do not use standard muted tones. A "Success" alert is a solid Mint block with a thick black border; an "Error" is solid Pink. Icons within alerts should be chunky and simplified.

### Data Chips
Small, 8px rounded pills used for variable tags (e.g., `mass`, `velocity`). Each variable category should be color-coded using the pastel palette to help users quickly scan complex formulas.

### Progress Bars
Thick black frames with a solid pastel fill (no gradients). Use the Pastel Yellow for "Calculating" states and Mint for "Complete."