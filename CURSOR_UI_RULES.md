# Rev Multimedia Academy — UI Design Rules v2.0
# REPLACE the previous CURSOR_UI_RULES.md entirely with this file
# Light theme. Nanod-inspired. Floating container. Premium cards.
# Cimons Technologies | 2025

---

## 19. UI Design System

This section governs every visual decision on the Rev Multimedia public platform.
The admin dashboard uses a separate dark theme — do not apply light theme rules there.

---

### 19.1 Design Philosophy

The public site feels like a premium creative academy platform.
Think: Nanod Academy meets a West African creative studio.

Key principles:
- Light, airy, lots of breathing room
- Everything sits inside a floating white container on a soft gray background
- Cards float with shadows — nothing is flat or boxed in with harsh lines
- Brand colours pop against the light base
- Generous padding — never cramped
- Asymmetric layouts — not everything centred
- Playful but professional

---

### 19.2 Colour System

```css
:root {
  /* Page background */
  --color-bg:           #F0F2F8;

  /* Surfaces */
  --color-surface:      #FFFFFF;
  --color-surface-2:    #F7F8FC;
  --color-surface-3:    #EEF0F8;

  /* Brand */
  --color-primary:        #C74A86;
  --color-primary-hover:  #9E3068;
  --color-primary-light:  #FDF0F6;
  --color-primary-dark:   #7A1F4E;

  --color-secondary:        #F18F3B;
  --color-secondary-hover:  #C4701E;
  --color-secondary-light:  #FEF6EE;

  --color-accent:         #2DBFB8;
  --color-accent-hover:   #1E9990;
  --color-accent-light:   #EBF9F8;

  /* Dark (text) */
  --color-dark:     #1A1A2E;
  --color-dark-2:   #252540;
  --color-dark-3:   #2F2F52;

  /* Grays */
  --color-gray-800: #2A2A3E;
  --color-gray-600: #5A5A7A;
  --color-gray-400: #9898B8;
  --color-gray-200: #D8D8E8;
  --color-gray-100: #EFEFF5;
  --color-gray-50:  #F8F8FC;

  /* Semantic */
  --color-success:       #2DBFB8;
  --color-success-light: #EBF9F8;
  --color-error:         #E84A4A;
  --color-error-light:   #FDECEC;
  --color-warning:       #F18F3B;
  --color-warning-light: #FEF6EE;
  --color-info:          #4A7BE8;
  --color-info-light:    #EBF0FD;

  /* Shadows — critical to the floating feel */
  --shadow-xs:   0 1px 3px rgba(26,26,46,0.06);
  --shadow-sm:   0 2px 8px rgba(26,26,46,0.08);
  --shadow-md:   0 4px 20px rgba(26,26,46,0.10);
  --shadow-lg:   0 8px 40px rgba(26,26,46,0.12);
  --shadow-xl:   0 16px 60px rgba(26,26,46,0.16);
  --shadow-card:       0 2px 16px rgba(26,26,46,0.08), 0 1px 4px rgba(26,26,46,0.04);
  --shadow-card-hover: 0 8px 40px rgba(26,26,46,0.14), 0 2px 8px rgba(26,26,46,0.06);
  --shadow-glow-primary: 0 8px 32px rgba(199,74,134,0.25);
  --shadow-glow-accent:  0 8px 32px rgba(45,191,184,0.25);

  /* Radius */
  --radius-sm:   8px;
  --radius-md:   14px;
  --radius-lg:   20px;
  --radius-xl:   28px;
  --radius-2xl:  36px;
  --radius-full: 9999px;

  /* Typography */
  --font-display: 'Clash Display', sans-serif;
  --font-body:    'DM Sans', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  /* Transitions */
  --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

### 19.3 Fonts

Load fonts via `<link>` tags in `app/layout.tsx` `<head>`.
Never use `next/font/google` — it fetches at build time and fails on slow networks.
Never use `@import` in CSS — less reliable than `<link>` tags.

```html
<!-- In app/layout.tsx <head> -->
<link rel="preconnect" href="https://api.fontshare.com" />
<link
  href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap"
  rel="stylesheet"
/>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500&display=swap"
  rel="stylesheet"
/>
```

Font usage:
- `font-family: var(--font-display)` — all headings, hero text, course titles, stats
- `font-family: var(--font-body)` — all body text, labels, nav links, buttons, forms
- `font-family: var(--font-mono)` — reference codes only (REVAPP..., REVINV..., Student IDs)

In Tailwind, map these as:
```
font-display → Clash Display
font-body    → DM Sans
font-mono    → JetBrains Mono
```

Apply to elements in globals.css:
```css
body {
  font-family: var(--font-body);
  background-color: var(--color-bg);
  color: var(--color-dark);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
}
```

---

### 19.4 Typography Scale

```
Display XL:  64px / Clash Display 700 / -1.5px tracking  (hero on dark/gradient sections)
Display L:   52px / Clash Display 700 / -1px tracking     (hero on light sections)
Display M:   40px / Clash Display 600 / -0.5px tracking   (section headlines)
H1:          32px / Clash Display 600 / -0.3px tracking   (page titles)
H2:          24px / Clash Display 600 / 0                 (card titles, sidebar heads)
H3:          20px / Clash Display 600 / 0                 (sub-section titles)
H4:          16px / DM Sans 600       / 0                 (labels, small headings)

Body L:      18px / DM Sans 400 / 1.7 line-height
Body M:      16px / DM Sans 400 / 1.7 line-height
Body S:      14px / DM Sans 400 / 1.6 line-height
Caption:     12px / DM Sans 500 / 0.04em tracking (uppercase labels)
Mono:        14px / JetBrains Mono / 0 (reference codes only)
```

Section label pattern (used above every headline):
```
DM Sans 12px 600
text-transform: uppercase
letter-spacing: 0.08em
color: var(--color-primary)
margin-bottom: 12px
```

---

### 19.5 The Floating Container (PageContainer)

This is the most important structural element. Every public page uses it.

```tsx
// components/ui/PageContainer.tsx
export function PageContainer({ children, className }) {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F0F2F8',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1320px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '32px',
        boxShadow: '0 8px 40px rgba(26,26,46,0.12)',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 32px)',
      }}>
        {children}
      </div>
    </div>
  )
}
```

Rules:
- Use inline styles for PageContainer — never Tailwind classes here
  (Tailwind purging can strip these if not used elsewhere)
- The outer div: `#F0F2F8` background, `16px` padding all sides
- The inner div: white, `32px` border-radius, shadow, max-width `1320px` centred
- Every public page (home, courses, about, contact, apply) wraps in PageContainer
- The navbar and footer live INSIDE the white container
- Admin pages do NOT use PageContainer

---

### 19.6 Navbar (Light Theme)

The navbar sits at the top of the white PageContainer.
It is NOT fixed or floating — it is part of normal document flow.

```
Height: 68px
Background: white
Border-bottom: 1px solid #EFEFF5
Padding: 0 32px
Position: relative (not fixed)
```

Layout (flex, items-center, justify-between):

LEFT — Logo:
  Small 2×2 dot grid icon (4 dots, brand colours)
  "Rev" — Clash Display 700 20px, --color-primary
  "Multimedia" — Clash Display 600 20px, --color-dark

CENTER — Search bar:
  Background: #F7F8FC
  Border: none
  Border-radius: 9999px
  Padding: 10px 20px
  Width: 280px
  Placeholder: "Search courses..."
  Search icon (left, inside): --color-gray-400
  Decorative only for now

RIGHT (flex items-center gap-4):
  Bell icon: 20px, --color-gray-400
  User avatar: 36px circle, gradient bg (primary → secondary)
    Shows initials "A" for Admin placeholder
  "Apply Now" button: primary sm rounded-full

Mobile: hamburger → full screen overlay (white bg this time)

---

### 19.7 Footer (Light Theme)

Sits inside the white container. Light styling.

```
Background: #F7F8FC
Border-top: 1px solid #EFEFF5
Padding: 48px 32px 32px
Border-radius: 0 0 32px 32px (matches container bottom)
```

Four columns (same structure as before):
- Brand: logo + tagline + social icons (--color-gray-400)
- Navigate: links in --color-gray-600, hover --color-primary
- Get in touch: phone, email, address (--color-gray-600)
- Academic partner: GTUC badge

Bottom bar:
- Border-top: 1px solid #EFEFF5
- Text: --color-gray-400, 13px
- Copyright left, Student Portal link right

---

### 19.8 Buttons

All buttons: rounded-full, DM Sans font, transition 200ms ease

```
Primary:
  Background: --color-primary (#C74A86)
  Text: white
  Hover: --color-primary-hover (#9E3068) + translateY(-1px) + shadow-glow-primary
  Padding: 12px 24px (md) / 10px 20px (sm) / 16px 32px (lg) / 20px 40px (xl)
  Font: DM Sans 15px 600

Secondary (outline):
  Background: transparent
  Border: 2px solid --color-primary
  Text: --color-primary
  Hover: background --color-primary-light

Ghost (on light bg):
  Background: #F0F2F8
  Text: --color-gray-600
  Hover: background --color-gray-100

Ghost (on dark/gradient bg):
  Background: rgba(255,255,255,0.12)
  Border: 2px solid rgba(255,255,255,0.40)
  Text: white
  Hover: background rgba(255,255,255,0.20)

Accent:
  Background: --color-accent (#2DBFB8)
  Text: white
  Hover: --color-accent-hover

Destructive:
  Background: #E84A4A
  Text: white
```

---

### 19.9 Cards

The card is the primary UI unit. Everything is a card.

Base card:
```css
background: white;
border-radius: var(--radius-lg);       /* 20px */
box-shadow: var(--shadow-card);
border: 1px solid rgba(26,26,46,0.05);
transition: all 0.25s var(--ease-smooth);
```

Card hover:
```css
box-shadow: var(--shadow-card-hover);
transform: translateY(-4px);
border-color: rgba(199,74,134,0.15);
```

Surface-2 card (slightly off-white, for alternating sections):
```css
background: #F7F8FC;
border-radius: var(--radius-lg);
box-shadow: var(--shadow-sm);
border: 1px solid #EFEFF5;
```

Gradient card (for hero/featured elements):
```css
background: linear-gradient(135deg, #C74A86 0%, #9E3068 100%);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-glow-primary);
```

Glass card (floating overlays):
```css
background: rgba(255,255,255,0.92);
backdrop-filter: blur(12px);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-md);
border: 1px solid rgba(255,255,255,0.60);
```

---

### 19.10 Course Card Spec

Each course card:
```
Background: white
Border-radius: 20px
Shadow: var(--shadow-card)
Overflow: hidden
Hover: translateY(-4px), shadow-card-hover
Transition: all 0.25s ease
```

Thumbnail (top, height 200px):
- next/image, fill, object-cover
- Gradient overlay at bottom: rgba(26,26,46,0.4) → transparent
- Category fallbacks:
  - graphic_design → /images/color-scheme.jpg
  - motion_graphics → /images/digital-pen.jpg
  - video_editing → /images/timeline.jpg
- Top-left badges: category + mode (white bg, brand text, shadow-xs, pill)
- Bottom-left instructor pill: glass card style, avatar + name
- Top-right duration badge: dark semi-transparent, rounded-full

Card body (padding 20px):
- Title: Clash Display 600 18px --color-dark
- Description: DM Sans 14px --color-gray-500 line-clamp-2
- Rating row: stars (--color-secondary) + score + review count
- Bottom row: GHS price (Clash Display 20px --color-primary) + Apply button (primary sm)
- Slots indicator below price: coloured dot + text

Ghost/Coming Soon card:
- Border: 1px dashed --color-gray-200
- Background: --color-surface-2
- Centred content: icon + name + "Coming Soon" pill
- No shadow

---

### 19.11 Badge and Pill Components

Category badges (on white bg):
```
graphic_design:   bg #FDF0F6, text #C74A86, border 1px #F9D0E6
motion_graphics:  bg #FEF6EE, text #C4701E, border 1px #FAD9B8
video_editing:    bg #EBF9F8, text #1E9990, border 1px #B8EDE9
```

Mode badges (on white bg):
```
online:     bg #EBF9F8, text #1E9990, border 1px rgba(45,191,184,0.30)
in_person:  bg #EBF9F8, text #1E9990, border 1px rgba(45,191,184,0.30)
hybrid:     bg #FEF6EE, text #C4701E, border 1px rgba(241,143,59,0.30)
```

All badges: rounded-full, DM Sans 12px 600, px-3 py-1

Status badges (application status):
```
pending:       bg #F0F0F8, text #9898B8
under_review:  bg #EBF0FD, text #4A7BE8
shortlisted:   bg #FEF6EE, text #C4701E
accepted:      bg #EBF9F8, text #1E9990
rejected:      bg #FDECEC, text #E84A4A
deferred:      bg #FDF0F6, text #C74A86
```

---

### 19.12 Form Inputs (Light Theme)

```
Background: white
Border: 1.5px solid #D8D8E8
Border-radius: 10px
Padding: 13px 16px
Font: DM Sans 15px --color-dark
Placeholder: --color-gray-400

Focus:
  border-color: --color-primary
  box-shadow: 0 0 0 3px rgba(199,74,134,0.10)
  outline: none

Error:
  border-color: --color-error
  box-shadow: 0 0 0 3px rgba(232,74,74,0.10)

Label: DM Sans 13px 600 --color-gray-600, mb-1.5
Helper text: 12px --color-gray-400, mt-1
Error text: 12px --color-error, mt-1
```

---

### 19.13 Section Layout Pattern

Every section inside the white container follows this pattern:

```
Padding: 64px 48px (desktop) / 48px 24px (tablet) / 40px 16px (mobile)
Max content width: 1200px, centred within the container
```

Section types and their backgrounds:
```
Primary section:    bg white
Alternate section:  bg #F7F8FC
Hero/CTA section:   bg gradient (primary → primary-dark)
```

Section spacing — always add clear visual separation:
- Background colour alternation between consecutive sections
- OR a 1px border-top: #EFEFF5 between same-colour sections

Section label (above every major headline):
```
DM Sans 12px 600
text-transform: uppercase
letter-spacing: 0.08em
color: var(--color-primary)
display: block
margin-bottom: 12px
```

---

### 19.14 Hero Section Pattern (Home Page)

Two-column layout (not full-screen, ~560px tall):

LEFT (55%, flex col justify-center, py-16 pl-12 pr-8):
  - Label pill badge (primary-light bg, primary text, rounded-full)
  - Headline: Clash Display 700 52px, --color-dark
    Last line/word in --color-primary
  - Subtext: DM Sans 16px --color-gray-600, max-width 420px
  - CTA row: primary button + secondary outline button, gap-3
  - Mini stats row: 3 inline stats (bold number + light label)

RIGHT (45%, relative, overflow visible):
  Main featured card (gradient bg, rounded-2xl, shadow-xl, ~380px tall):
    - Background image with dark overlay
    - Course name, subtext
    - Bottom: avatar cluster + "Applications Open" pill

  Floating glass cards overlapping the main card:
    Card 1 (top-right, -translate-y-4 translate-x-4):
      "Next Intake" + date — white card, shadow-lg
    Card 2 (bottom-left, translate-y-6 -translate-x-6):
      Avatar cluster + "50+ trained" — white card, shadow-lg

  Decorative dots: small coloured circles scattered around

---

### 19.15 Scattered Avatar Layout

Used on Home (community section) and About (team section).
NOT a ring/orbital — scattered freely like Image 2 reference.

Container: 400px × 400px, position relative

7 avatars at fixed positions (absolute):
```
person1: top 8%   left 18%  size 64px
person2: top 4%   left 58%  size 48px
person3: top 32%  left 4%   size 56px
person4: top 28%  left 72%  size 52px
person5: top 58%  left 12%  size 60px
person6: top 62%  left 52%  size 44px
person7: top 78%  left 32%  size 56px
```

Each avatar:
```
next/image, rounded-full, object-cover
border: 3px solid white
box-shadow: var(--shadow-md)
```

Featured pill (position absolute, top 44% left 38%):
```
background: linear-gradient(135deg, #C74A86, #F18F3B)
border-radius: 9999px
padding: 10px 16px
box-shadow: var(--shadow-glow-primary)
display: flex, align-items: center, gap: 10px

Avatar inside pill: 32px rounded-full
Text: "Featured Student" 10px white/70 uppercase
Name/stat: DM Sans 600 white 13px
```

Connecting dots (scattered between avatars):
```
6px circles, background --color-primary, opacity 0.25
position absolute, scattered at various positions
```

---

### 19.16 GSAP Animation Rules

No snap scroll on any page.
Use ScrollTrigger for scroll-driven animations only.

Standard entrance animation (use for most elements):
```typescript
gsap.from(element, {
  opacity: 0,
  y: 30,
  duration: 0.7,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: element,
    start: 'top 85%',
    once: true,
  }
})
```

Stagger for groups (cards, feature blocks):
```typescript
gsap.from(elements, {
  opacity: 0,
  y: 40,
  duration: 0.6,
  stagger: 0.12,
  ease: 'power3.out',
  scrollTrigger: { trigger: container, start: 'top 80%', once: true }
})
```

Hero animations (on mount, no ScrollTrigger):
```typescript
const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
tl.from(badge,    { opacity: 0, y: 20, duration: 0.5 }, 0.2)
  .from(line1,    { opacity: 0, y: 40, duration: 0.6 }, 0.4)
  .from(line2,    { opacity: 0, y: 40, duration: 0.6 }, 0.55)
  .from(line3,    { opacity: 0, y: 40, duration: 0.6 }, 0.70)
  .from(subtext,  { opacity: 0, y: 20, duration: 0.5 }, 0.90)
  .from(ctaRow,   { opacity: 0, y: 20, duration: 0.5 }, 1.05)
  .from(heroCard, { opacity: 0, scale: 0.95, duration: 0.7 }, 0.5)
```

Floating element (continuous, hero card decoration):
```typescript
gsap.to(floatingCard, {
  y: -10, duration: 3, repeat: -1, yoyo: true, ease: 'sine.inOut'
})
```

Stat counter animation:
```typescript
gsap.from(counter, {
  textContent: 0,
  duration: 1.5,
  ease: 'power2.out',
  snap: { textContent: 1 },
  scrollTrigger: { trigger: statsSection, start: 'top 80%', once: true }
})
```

Avatar scatter entrance:
```typescript
gsap.from(avatars, {
  opacity: 0,
  scale: 0.5,
  duration: 0.5,
  stagger: { each: 0.08, from: 'random' },
  ease: 'back.out(1.7)',
  scrollTrigger: { trigger: avatarContainer, start: 'top 75%', once: true }
})
```

Rules:
- All GSAP code in 'use client' components only
- Register plugins at top of file: `gsap.registerPlugin(ScrollTrigger)`
- Clean up in useEffect return: `ScrollTrigger.getAll().forEach(t => t.kill())`
- Never use snap scroll (ScrollTrigger.normalizeScroll or snap config)

---

### 19.17 Page-Specific Layout Rules

#### Home Page
- No full-screen sections
- Natural scroll, sections flow one after another
- Each section: alternating white / #F7F8FC background
- Section order:
  1. Navbar (white, in container)
  2. Hero (white, two-col)
  3. Stats bar (#F7F8FC, horizontal stats + avatars)
  4. Community / Scattered avatars (white, two-col)
  5. Courses (white, 3-col grid)
  6. Why Rev (#F7F8FC, two-col image + features)
  7. Testimonials (white, 3-col cards)
  8. CTA (gradient, full width within container)
  9. Footer (#F7F8FC, in container)

#### Courses Page
- Hero banner (~300px, not full screen): white bg, headline + filters + decorative image
- Course grid: #F7F8FC background, 3-col, padding 48px
- No snap scroll

#### About Page
- Hero banner: gradient bg (primary), ~400px
- Mission + Vision: white, two-col cards
- Founder: white, two-col (text left, photo right)
- GTUC: #F7F8FC, centred
- Team scattered avatars: white, two-col
- Location: white, two-col (details left, map right)
- No snap scroll

#### Contact Page
- Hero + form: side by side, white bg
- FAQ: #F7F8FC bg, accordion
- No snap scroll

#### Application Form /apply
- Sits inside PageContainer
- White form card, shadow-md, rounded-2xl
- Step indicator at top with primary colour
- Light bg for the page (#F7F8FC)

---

### 19.18 Admin Dashboard (DARK — unchanged)

Admin pages do NOT use PageContainer.
Admin keeps the original dark theme:
- Background: #1A1A2E
- Sidebar: #252540
- Content area: #F8F8FC (light content area inside dark shell)
- All admin-specific components stay dark

Do not apply any light theme rules to files in app/(admin)/

---

### 19.19 Reference Code Display

For Student IDs, REVAPP, REVINV reference codes:
```
Font: JetBrains Mono 14px
Background: rgba(45,191,184,0.08)
Border: 1px solid rgba(45,191,184,0.25)
Border-radius: 8px
Padding: 8px 14px
Color: --color-accent (#2DBFB8)
Display: inline-flex, align-items: center, gap: 8px
Copy icon on right, changes to check on click
```

---

### 19.20 Tailwind Config

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C74A86',
          hover:   '#9E3068',
          light:   '#FDF0F6',
          dark:    '#7A1F4E',
        },
        secondary: {
          DEFAULT: '#F18F3B',
          hover:   '#C4701E',
          light:   '#FEF6EE',
        },
        accent: {
          DEFAULT: '#2DBFB8',
          hover:   '#1E9990',
          light:   '#EBF9F8',
        },
        dark: {
          DEFAULT: '#1A1A2E',
          2:       '#252540',
          3:       '#2F2F52',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2:       '#F7F8FC',
          3:       '#EEF0F8',
        },
        brand: {
          bg: '#F0F2F8',
          gray: {
            50:  '#F8F8FC',
            100: '#EFEFF5',
            200: '#D8D8E8',
            400: '#9898B8',
            600: '#5A5A7A',
            800: '#2A2A3E',
          }
        }
      },
      fontFamily: {
        display: ['Clash Display', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm:    '8px',
        md:    '14px',
        lg:    '20px',
        xl:    '28px',
        '2xl': '36px',
      },
      boxShadow: {
        'xs':           '0 1px 3px rgba(26,26,46,0.06)',
        'sm':           '0 2px 8px rgba(26,26,46,0.08)',
        'md':           '0 4px 20px rgba(26,26,46,0.10)',
        'lg':           '0 8px 40px rgba(26,26,46,0.12)',
        'xl':           '0 16px 60px rgba(26,26,46,0.16)',
        'card':         '0 2px 16px rgba(26,26,46,0.08), 0 1px 4px rgba(26,26,46,0.04)',
        'card-hover':   '0 8px 40px rgba(26,26,46,0.14), 0 2px 8px rgba(26,26,46,0.06)',
        'glow-primary': '0 8px 32px rgba(199,74,134,0.25)',
        'glow-accent':  '0 8px 32px rgba(45,191,184,0.25)',
      },
      animation: {
        'float':     'float 3s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'fade-up':   'fade-up 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'pulse-dot': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':      { transform: 'scale(1.4)', opacity: '0.6' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
```

---

### 19.21 What to Never Do

- Never use dark backgrounds on public pages (except the CTA gradient section)
- Never use full-viewport-height snap scroll sections
- Never use harsh borders or heavy outlines on cards
- Never let the page background be pure white (#fff) — use #F0F2F8 as page bg
- Never use more than 3 font weights in one view
- Never use `next/font/google` — CDN link tags only
- Never apply light theme rules to admin pages
- Never use the "N" placeholder in the navbar avatar — use initials or remove
- Never use `overflow: hidden` on the outer PageContainer div (cuts off shadows)
- Never stack cards without breathing room — minimum 24px gap between cards
- Never use `@import` in CSS for fonts — use `<link>` in layout.tsx head

---

*End of CURSOR_UI_RULES_V2.md*
*Replace CURSOR_UI_RULES.md in the project root with this file entirely.*
