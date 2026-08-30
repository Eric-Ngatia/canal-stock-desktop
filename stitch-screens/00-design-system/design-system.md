---
name: Precision Logistics
colors:
  surface: '#fcf8fc'
  surface-dim: '#dcd9dd'
  surface-bright: '#fcf8fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f2f7'
  surface-container: '#f0edf1'
  surface-container-high: '#eae7eb'
  surface-container-highest: '#e4e1e6'
  on-surface: '#1b1b1e'
  on-surface-variant: '#464555'
  inverse-surface: '#303033'
  inverse-on-surface: '#f3f0f4'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5d5d68'
  on-secondary: '#ffffff'
  secondary-container: '#e3e1ee'
  on-secondary-container: '#63636e'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e3e1ee'
  secondary-fixed-dim: '#c6c5d2'
  on-secondary-fixed: '#1a1b24'
  on-secondary-fixed-variant: '#454650'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8fc'
  on-background: '#1b1b1e'
  surface-variant: '#e4e1e6'
typography:
  key-value:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.02em
  page-title:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  subtitle:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-table:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-metadata:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base_unit: 4px
  gutter: 16px
  margin_mobile: 16px
  margin_desktop: 24px
  container_max_width: 1440px
---

## Brand & Style
The design system is built for a high-efficiency B2B SaaS environment where speed, accuracy, and clarity are paramount. It draws heavily from **Minimalism** and **Modern Corporate** aesthetics, prioritizing data density and functional utility over decorative elements.

The visual narrative is "Invisible Infrastructure"—a workspace that stays out of the user's way. It uses a sophisticated light-mode palette, ample negative space, and meticulous alignment to reduce cognitive load during repetitive inventory management tasks. The interface feels systematic, dependable, and precise, mirroring the logistical rigor required for hardware distribution.

## Colors
The palette is rooted in a "cool-gray" spectrum to ensure long-term legibility.
- **Surface Strategy:** The main background is a soft gray (#F5F5F7), allowing white (#FFFFFF) containers to "pop" and indicate interactive or prioritized areas.
- **Functional Colors:** Success, Warning, and Danger colors are used sparingly, reserved strictly for status badges and critical alerts to maintain their signal strength.
- **Primary Accent:** Indigo (#4F46E5) is used exclusively for primary actions and active navigation states.

## Typography
Inter is used across the entire system for its exceptional readability in UI contexts.
- **Tabular Figures:** All numbers, serial codes, and dates must use `font-variant-numeric: tabular-nums`. This ensures vertical alignment in data tables, crucial for comparing hardware IDs.
- **Hierarchy:** We use a tight scale to maintain data density. Page titles are intentionally modest at 20px to leave more vertical room for list items and table rows.

## Layout & Spacing
This design system utilizes a **4px grid system** to ensure mathematical harmony between all elements.
- **The Sidebar:** Fixed at 240px width. It uses a "soft-bleed" design where the active state is marked by a subtle background tint and an indigo vertical pill on the left.
- **Content Area:** A fluid-grid model with a maximum width of 1440px. On wider screens, the content centers with a 24px outer margin.
- **Table Density:** Rows in data tables should have a fixed height of 48px to allow for high information density while remaining touch-friendly for warehouse tablet use.

## Elevation & Depth
Depth is created through **Tonal Layering** and very subtle ambient shadows.
- **Level 0 (Base):** #F5F5F7 - Used for the application background.
- **Level 1 (Card):** #FFFFFF - Used for content containers. Includes a 1px solid border (#E5E5EA) and a `0 1px 3px rgba(0,0,0,0.05)` shadow.
- **Level 2 (Dropdown/Modal):** #FFFFFF - Uses a more pronounced "floating" shadow: `0 10px 15px -3px rgba(0,0,0,0.1)`.
- **Interaction:** On hover, table rows should change to a #F9F9FB background tint rather than using shadows.

## Shapes
The shape language combines "modern-soft" containers with "precise" interactive elements.
- **Large Radius (16px):** Reserved for primary content cards and dashboard modules to soften the data-heavy layout.
- **Medium Radius (8px):** Used for buttons and input fields to maintain a professional, structural feel.
- **Full Radius (Pill):** Used exclusively for status badges and tags to distinguish them from interactive buttons.

## Components

### Sidebar & Top Bar
- **Sidebar:** Icons should be 20px, outlined style. Active nav items use #4F46E5 for both icon and text.
- **Top Bar:** 64px height, white background, bottom border #E5E5EA. Search input should be an "expandable" ghost style with a 14px text size.

### Buttons
- **Primary:** Background #4F46E5, Text #FFFFFF.
- **Secondary:** Background #FFFFFF, Border 1px #E5E5EA, Text #111114.
- **Danger:** Background #DC2626, Text #FFFFFF.
- **Disabled:** Background #E5E5EA, Text #6B6B76, Cursor: not-allowed.

### Forms & Textarea
- **Inputs:** 40px height. 1px border #E5E5EA. Focus state: Border #4F46E5, Box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1).
- **Textarea:** Specifically optimized for bulk serial numbers. Use monospaced numbers if possible, with a 20px line-height to make scanning long lists easier.

### Status Badges
- **Style:** Small, caps, bold.
- **Stock:** Light gray background, #6B6B76 text.
- **Vendu:** Light orange background, #F97316 text.
- **Activé:** Light green background, #16A34A text.
- **Erreur:** Light red background, #DC2626 text.

### Data Tables
- **Headers:** Light gray background (#F9F9FB), uppercase 12px text, border-bottom 1px.
- **Rows:** Border-bottom 1px #E5E5EA. Hover state: #F5F5F7.

### Progress Bars
- 8px height, rounded. Background #E5E5EA. Fill color #4F46E5. For "Objective" tracking, use Success green if the goal is >90% complete.

### Skeleton Loaders
- Use a 1.5s pulsing animation from #E5E5EA to #F5F5F7. Match the radius of the element being loaded (e.g., 16px for cards).
