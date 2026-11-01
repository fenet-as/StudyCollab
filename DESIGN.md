---
name: StudyCollab
description: Distraction-free academic collaboration workspace for university and college student study groups
colors:
  primary: "#2563EB"
  primary-hover: "#1D4ED8"
  primary-dark: "#3B82F6"
  accent: "#7C3AED"
  accent-hover: "#6D28D9"
  bg-light: "#F8FAFC"
  bg-dark: "#0B1120"
  card-light: "#FFFFFF"
  card-dark: "#111827"
  row-dark: "#172033"
  highlight-light: "#F1F5F9"
  highlight-dark: "#1E293B"
  text-light-primary: "#0F172A"
  text-light-muted: "#475569"
  text-dark-primary: "#F8FAFC"
  text-dark-muted: "#CBD5E1"
  border-light: "#E2E8F0"
  border-dark: "#1E293B"
  danger: "#DC2626"
  danger-bg: "#FEF2F2"
  danger-dark: "#EF4444"
typography:
  display:
    fontFamily: "Poppins, Inter, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  heading:
    fontFamily: "Poppins, Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-secondary:
    backgroundColor: "{colors.highlight-light}"
    textColor: "{colors.text-light-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.card-light}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System

## Overview
StudyCollab is an academic collaboration workspace tailored for university students. Its aesthetic is **modern academic focus** — clean, distraction-free, high-scanability, and restrained. It prioritizes legibility, seamless dark/light mode transitions, clear role hierarchies, and smooth micro-interactions that stay comfortable over multi-hour study sessions.

## Colors
- **Primary Brand**: Blue (`#2563EB` light / `#3B82F6` dark) serves as the primary action color (buttons, active tabs, invite links, owner badges).
- **Secondary Accent**: Purple (`#7C3AED` light / `#8B5CF6` dark) designates administrative controls, elevated badges, and collaborative highlights.
- **Neutrals**:
  - **Light Mode**: Main background `#F8FAFC`, card background `#FFFFFF`, subtle borders `#E2E8F0`, deep slate typography `#0F172A`.
  - **Dark Mode**: Midnight background `#0B1120`, elevated cards `#111827`, secondary rows `#172033`, crisp white text `#F8FAFC`, muted gray `#CBD5E1`.
- **Feedback & Danger**: Crimson red (`#DC2626` light / `#EF4444` dark) with soft tinted backdrops (`#FEF2F2`) for destructive confirmations, error notices, and member removals.

## Typography
- **Headings & Display**: `Poppins`, 600 weight, with clean letter-spacing for dashboard headers, card titles, and modal headers.
- **Body & Controls**: `Inter`, 400 (regular) and 500 (medium) weights for notes content, button text, labels, and table metadata.
- **Code & Snippets**: System monospaced stack for invite tokens, IDs, and technical notes.

## Layout
- **Fixed Sidebar + Fluid Main Stage**: A 260px fixed sidebar for active groups, navigation, and user identity, with a full-height scrollable main viewport for group overviews, notes, and chat.
- **Card-Based Stack**: Group settings, account profiles, and overviews are organized in modular, stacked cards with standardized 24px inner padding and 16px to 24px vertical gaps.
- **Mobile Responsive Drawer**: Collapsible mobile navigation drawer with hamburger toggle for viewports under 768px.

## Elevation & Depth
- **Restrained Shadows**: Avoid heavy dropshadows. Rely on subtle borders (`1px solid var(--border-color)`) and soft ambient shadows (`0 1px 3px rgba(0,0,0,0.06)` light, `0 4px 12px rgba(0,0,0,0.35)` dark) to provide clean card separation.
- **Modal Overlays**: Centered dialogs with backdrop-filter (`blur(4px)`) and semi-transparent dark backing (`rgba(0, 0, 0, 0.6)`) to ensure focus during confirmation workflows.

## Shapes
- **Corner Radii**: Standardized on 8px (`--radius-md`) for buttons and form inputs, 12px (`--radius-lg`) for structural cards, and full pill (`--radius-full`) for role badges and avatars.
- **Icons**: 16px to 20px Lucide icons enclosed in circular or rounded-square tinted backdrops for clear visual signposting.

## Components
- **Buttons**:
  - Primary: Filled blue with slight hover translate (`-1px`) and soft shadow.
  - Secondary/Ghost: Neutral tint with border highlight on hover.
  - Destructive: High-contrast red fill or outline with explicit confirmation modal.
- **Cards & Inputs**: Clean borders, generous padding, and clear focus outlines (`2px solid var(--primary-color)`).
- **Role Badges**: Pill-shaped indicator tags with distinct color-coding (Owner = Blue tint, Admin = Purple tint, Member = Slate gray).

## Do's and Don'ts
- **DO**:
  - Maintain strong text contrast ratios across both light and dark modes (minimum 4.5:1 for body copy).
  - Use `ConfirmModal` for all destructive actions (leaving groups, removing members, demoting admins, regenerating invite codes).
  - Always extract and display friendly server error messages (`error.response?.data?.message`).
- **DON'T**:
  - Don't use browser-native `window.confirm` or `alert` popups.
  - Don't use harsh neon gradients or unconstrained glassmorphism that obscures text readability.
  - Don't place dense decorative widgets that distract from core study workflows (reading notes, checking tasks, and collaborating).
