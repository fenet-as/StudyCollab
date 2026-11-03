# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
University and college students collaborating on shared coursework, group projects, exam preparation, and peer study sessions.

## Product Purpose
Provide an all-in-one, distraction-free collaborative study hub that unifies private study groups, real-time shared notes, and peer communication into a single focused workspace.

## Positioning
Combines private group spaces, collaborative rich-text notes with draft safety, and group discussions into a dedicated academic environment without the noise or distractions of general-purpose social networks.

## Operating Context
Active study sessions, group project sprints, lecture note organization, and exam revision across desktop, tablet, and mobile web viewports. Designed for extended daily use with both polished dark and light themes.

## Capabilities and Constraints
- **Study Groups**: Private group creation, secure invite links/codes with regeneration, classmate email invitations, role-based access control (Creator, Admin, Member), and avatar customization.
- **Collaborative Notes**: Rich-text editing, background draft preservation, dirty state tracking, print/export formatting, and notes sidebar hierarchy.
- **Group Discussions**: Channel-based chat and peer messaging.
- **Identity & Security**: JWT token authentication with automated refresh rotation, email verification with resend handling, and secure profile management.
- **Technical Architecture**: React 18 + Vite SPA with CSS Modules and vanilla tokens on the frontend; Spring Boot 3, PostgreSQL, and Cloudflare R2 on the backend.

## Brand Commitments
- **Name**: StudyCollab
- **Tone**: Academic focus — clean, elevated, distraction-free modern UI with crisp typography, robust contrast, and purposeful micro-interactions.

## Evidence on Hand
- Working React 18 frontend with dashboard, notes editor, chat interface, group settings, and authentication flows.
- Spring Boot 3 REST backend with PostgreSQL database and SMTP mail integration.
- 135 unit/integration frontend tests passing with zero ESLint warnings.

## Product Principles
1. **Academic Focus & Scanability**: Put notes, discussions, and group materials front and center; eliminate visual clutter and low-contrast elements.
2. **Predictable & Restful Polish**: Subtle elevation, cohesive spacing rhythm, and calm transitions that remain comfortable over long study hours in light or dark themes.
3. **Data Safety & Draft Protection**: Never lose user notes or active input; provide explicit confirmation dialogs for destructive actions.
4. **Responsive Integrity**: Ensure all navigation drawers, dialogs, cards, and editors remain fully functional and beautifully proportioned on all screen sizes.
