# Changelog

All notable changes to SalesFlow CRM are documented here.
Versioning follows [Semantic Versioning 2.0.0](https://semver.org):
- **MAJOR** — incompatible API/schema changes or architectural shifts
- **MINOR** — new features, backwards-compatible
- **PATCH** — bug fixes, small improvements

"What's New" in-app banners are shown to users after every MINOR or MAJOR release.

---

## [1.3.0] — 2026-06-29 — *White-label Branding*

### Added
- **Brand & Identity settings** — org admins can upload a logo, favicon, and set primary/accent/sidebar colours
- 6 built-in colour presets (Indigo, Emerald, Rose, Amber, Sky, Violet)
- Branding applied live via CSS custom properties (no reload required)
- Favicon and browser tab title update automatically to match org branding
- Reset to default option

### Fixed
- Login: show/hide password toggle added to password field
- Login: failed login now shows "Email or password not recognised" (no user enumeration)
- Superadmin: full navigation restored — superadmin now has complete sidebar plus Console link

---

## [1.2.0] — 2026-06-28 — *Superadmin & Support Roles*

### Added
- **Superadmin role** — platform-level account with access to all organisations
- **Support role** — customer-facing support with verified access flow
- 6-digit verification code sent to org admins before support can act
- Superadmin console: list all orgs, drill into team roster, manage support users
- Support users can be created/deleted by superadmins from the Console
- Active support sessions shown in console with expiry timer

---

## [1.1.0] — 2026-06-27 — *Mobile App & AI Pipeline*

### Added
- **Flutter mobile app** (iOS + Android) — voice capture, leads list, JWT auth
- Voice recording → Groq Whisper transcription → AI lead extraction → editable review → save
- Phase 4 feedback widget (visible to trial/demo orgs only)
- Forgot password + reset password email flow (1-hour token via Resend)
- Terms of Service and Privacy Policy pages (Australian Privacy Act)
- Kanban "+ New Lead" button
- Lead filters: Source dropdown, Stale toggle, Unassigned toggle
- Files: upload button with lead search in Recordings page

---

## [1.0.0] — 2026-06-26 — *Initial Release*

### Added
- Multi-tenant CRM with org isolation
- Roles: admin, agent, viewer
- Lead pipeline (Kanban + list), lead detail with AI score
- AI SmartAdd (voice + text → structured lead data)
- Inbox / messaging
- Dashboard with activity feed
- HubSpot direct sync
- Stripe billing integration
- Cloudflare Turnstile CAPTCHA on login/signup
- Email verification, 2FA (TOTP)
- Dark mode
- Deployed on Render via Docker, Neon Postgres
