# SalesFlow CRM — User Manual

> **Version:** 1.4 · **Last updated:** June 2026  
> **Production URL:** https://crm-mjky.onrender.com

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Leads](#3-leads)
4. [Kanban Board](#4-kanban-board)
5. [AI Agents](#5-ai-agents)
6. [Voice Capture](#6-voice-capture)
7. [Files & Recordings](#7-files--recordings)
8. [Inbox & Messages](#8-inbox--messages)
9. [Settings](#9-settings)
10. [Admin Guide](#10-admin-guide)
11. [Superadmin Guide](#11-superadmin-guide)
12. [Mobile App](#12-mobile-app)
13. [Roles & Permissions](#13-roles--permissions)
14. [FAQ & Troubleshooting](#14-faq--troubleshooting)

---

## 1. Getting Started

### Logging In

1. Go to **https://crm-mjky.onrender.com**
2. Enter your email and password
3. Complete the CAPTCHA (required on first login from a new device)
4. Click **Sign in**

> **Security note:** Superadmin accounts are blocked on mobile browsers and must log in from a desktop or laptop.

### First Login

On your first login you'll be prompted to complete the onboarding checklist. We recommend:

1. Upload a profile photo in **Settings → Profile**
2. Change your password if you were given a temporary one
3. Add your first lead via the **+** button on the Leads page

### Forgotten Password

Contact your organisation admin to reset your password. Admins can reset passwords from **Settings → Team**.

### Changing Your Password

1. Go to **Settings** (bottom of the left sidebar)
2. Click **Security**
3. Enter your current password, then your new password twice
4. Click **Save**

---

## 2. Dashboard

The Dashboard gives you a live overview of your pipeline.

### What You'll See

| Widget | Description |
|--------|-------------|
| **Funnel** | Count of leads at each stage: New → Contacted → Qualified → Proposal → Negotiation → Closed Won |
| **Recent leads** | Your last 10 leads, clickable to open the detail view |
| **AI activity** | Latest outputs from your AI agents |
| **Follow-ups due** | Leads with a follow-up reminder due today |

### Lead Cards

Click any lead card on the dashboard to open the full lead detail view. You can update the stage, add notes, and review AI outputs without leaving the dashboard.

### Trial / Upgrade Banner

If your organisation is on a free trial, a banner at the top shows how many days remain. Click **Upgrade** to go to billing settings.

---

## 3. Leads

Leads are the core of SalesFlow CRM. Each lead represents a contact or opportunity you are working.

### Adding a Lead

**Option A — Manual:**
1. Click the **+** button (top right of the Leads page)
2. Fill in: Name, Email, Company, Phone, Stage, Value
3. Click **Save**

**Option B — Voice capture:** Record a voice note and AI extracts the lead details automatically. See [Voice Capture](#6-voice-capture).

**Option C — CSV import:** Admin users can import leads in bulk from **Settings → Import**.

### Lead Stages

Leads move through a standard sales pipeline:

| Stage | Meaning |
|-------|---------|
| **New** | Just entered — no contact made yet |
| **Contacted** | First outreach sent or call made |
| **Qualified** | Confirmed budget, authority, need, timeline |
| **Proposal** | Proposal or quote sent |
| **Negotiation** | Terms being discussed |
| **Closed Won** | Deal confirmed ✓ |
| **Closed Lost** | Opportunity did not convert |

To change a lead's stage: open the lead → click the stage badge → select the new stage.

### Lead Detail View

Click any lead to open the full detail view:

- **Overview tab** — contact info, company, value, assigned agent, tags
- **Activity tab** — full timeline of notes, calls, emails, stage changes
- **AI tab** — outputs from AI agents run on this lead
- **Recordings tab** — voice notes and transcriptions linked to this lead

### Assigning Leads

Admins can assign leads to any agent. Agents only see leads assigned to them.

To assign: open the lead → click **Assigned to** → select an agent.

### Tagging

Tags help filter and segment your pipeline. Add tags from the lead detail view. Admins can manage the tag list from **Settings → Tags**.

### AI Lead Score

Each lead has an AI score (0–100) reflecting conversion likelihood based on engagement, stage, and profile. Click **Score** on any lead to request a fresh score.

### Bulk Actions

On the Leads list page, tick multiple leads to:
- Reassign to a different agent
- Change stage in bulk
- Add or remove tags
- Export to CSV

---

## 4. Kanban Board

The Kanban board gives a visual drag-and-drop view of your pipeline. Available to **admin** and **superadmin** roles.

### Using the Board

- Drag a card left or right to change its stage
- Click a card to open the full lead detail
- Use the **Filter** button (top right) to filter by agent, tag, or value

### Swimlanes

By default the board shows one column per pipeline stage. Toggle **Group by agent** to see a swimlane per sales rep.

---

## 5. AI Agents

AI Agents automatically analyse and act on your leads. Each agent runs on a trigger and produces written output in the lead's AI tab.

### Built-in Agent Types

| Type | What it does |
|------|-------------|
| **Pipeline health** | Reviews stale leads and flags ones that need attention |
| **Call debrief** | Summarises a voice recording into action points |
| **Re-engagement** | Drafts a personalised outreach message for cold leads |
| **Drip sequence** | Writes a multi-touch follow-up email sequence |

### Triggers

| Trigger | When it fires |
|---------|--------------|
| **On lead created** | Immediately when a new lead is added |
| **On recording uploaded** | When a voice note is transcribed |
| **On stage stuck** | When a lead hasn't moved stage in N days |
| **Scheduled (daily)** | Once per day at the configured time |
| **Manual** | Only when you click **Run** on a lead |

### Creating an Agent

1. Go to **AI Agents** in the sidebar
2. Click **New agent**
3. Choose a type and trigger
4. Customise the prompt to match your team's tone and industry
5. Set the target leads (all, by tag, by stage)
6. Click **Save**

### Agent Run Interval

By default, scheduled agents fire every 30 minutes. Your admin can change this in **Settings → AI Agents**. Set to **0** to disable automatic firing entirely.

### Viewing Agent Output

Agent output appears in two places:
- The **AI tab** on each individual lead
- The **Dashboard** activity feed

A toast notification also appears in the top-right when an agent completes on a lead assigned to you.

---

## 6. Voice Capture

Voice Capture lets you record a conversation or debrief and have AI extract a lead and key details automatically.

### Recording on Desktop

1. Click the **red microphone button** (bottom of the left sidebar, or centre of the mobile bottom bar)
2. Grant microphone permission when prompted
3. Click **Start recording**
4. Speak naturally — describe the person, company, what was discussed, and next steps
5. Click **Stop**
6. AI transcribes and extracts: name, email, company, phone, stage, notes
7. Review the extracted fields and edit if needed
8. Click **Save lead** to add it to your pipeline

### Recording on Mobile

The centre microphone button on the bottom tab bar opens Voice Capture. The flow is the same as desktop.

### Tips for Better Extraction

- Say the person's full name and company name clearly
- Mention their email or spell it out
- Include an explicit stage: *"They're qualified — we sent a proposal"*
- Say next steps: *"Follow up on Thursday"*

### Unresolved Recordings

If you record but don't save the lead, it goes into **Unresolved recordings** (Settings → Files). You'll get a reminder notification after 4 hours and an escalation after 24 hours.

---

## 7. Files & Recordings

All voice recordings and uploaded files are stored in **Files** (microphone icon in the sidebar).

### What's Stored

- Voice capture recordings (MP3)
- Auto-generated transcripts
- AI summaries
- Uploaded documents linked to leads

### Listening to a Recording

Click any recording to expand it. Use the inline player to listen. The full transcript appears below with AI summary and extracted lead details.

### Downloading Files

Click the **⬇** icon next to any file to download it.

### Storage

Files are stored in Cloudflare R2. There is no hard storage limit on pro plans.

---

## 8. Inbox & Messages

The Inbox is a team messaging tool for internal communication and lead-related discussions.

### Sending a Message

1. Click **Messages** in the sidebar
2. Select a team member from the left panel
3. Type your message and press **Enter**

### Mentioning Someone

Type `@name` in any message or lead note to mention a team member. They'll receive a toast notification and a browser notification (if permitted).

### Unread Badge

The Messages icon in the sidebar shows a red badge with your unread count. This updates in real time.

### Lead-Linked Discussions

From any lead detail view, the **Activity** tab includes a notes/message thread scoped to that lead.

---

## 9. Settings

Access Settings from the bottom of the left sidebar.

### Profile

- **Name** — Update your display name
- **Avatar** — Upload a profile photo (JPG/PNG, max 2MB)
- **Email** — Contact your admin to change your login email

### Security

- **Change password** — Requires your current password
- **Active sessions** — See where you're logged in

### Notifications

Configure which in-app and browser notifications you receive:
- Lead assigned to you
- Follow-up reminders
- Agent outputs
- New messages

### Theme

Toggle between **Light** and **Dark** mode from the bottom of the sidebar (sun/moon icon).

---

## 10. Admin Guide

Admins have additional controls under **Settings** and can see the full Kanban board.

### Managing Your Team

**Settings → Team**

- **Invite a user** — Enter email and role (agent / admin), click **Send invite**
- **Reset password** — Click the key icon next to a user
- **Deactivate** — Removes login access without deleting their data
- **Role change** — Click the role badge to promote or demote

### Branding

**Settings → Branding**

Customise the CRM to match your corporate identity:

1. **Logo** — Upload a PNG/SVG (displayed in the sidebar header)
2. **Favicon** — Upload a 32×32 or 64×64 PNG (browser tab icon)
3. **Colours** — Choose from 6 presets or set exact hex codes for:
   - Primary colour (buttons, active nav items)
   - Accent colour (badges, highlights)
   - Background colour (sidebar)

Click **Save colours** to apply instantly. Click **Reset to default** to revert.

### AI Agent Interval

**Settings → AI Agents → Run interval**

Choose how often scheduled agents fire for your organisation:
- Off (0) — agents only run manually
- 15 min, 30 min, 1 hr, 2 hr, or custom

This setting applies to your org only.

### CSV Import

**Settings → Import**

1. Click **Download template** to get the correct column format
2. Fill in your leads CSV
3. Upload it — duplicate emails are skipped
4. Review the import summary

### Demo Mode

New organisations start in Demo Mode with sample data. Go to **Settings → Demo** and click **Disable demo mode** to clear sample data and start fresh with real leads.

> ⚠️ Demo mode cannot be re-enabled once disabled.

### Audit Log

**Settings → Audit**

Every action that creates, modifies, or deletes data is logged here with timestamp, user, and IP address. Useful for compliance and security reviews.

---

## 11. Superadmin Guide

Superadmin is a platform-level role. It can see and manage all organisations but **cannot view any organisation's leads** (by design, for data privacy).

> **Requirement:** Superadmin must use a desktop browser. Mobile access is blocked.

### Console Access

Log in and navigate to **Console** (shield icon in the sidebar).

### Organisation Management

The Console lists all organisations with their plan, user count, and status.

**To view an organisation:**
Click its name to see members, plan details, and usage.

**Request access (for support purposes):**
1. Click **Request access** on an organisation
2. A verification code is sent to your email
3. Enter the code to confirm — this is logged in the audit trail
4. You now have temporary read access to that org

**To delete an organisation:**
1. Click **Delete** on the org
2. Type the organisation's exact name to confirm
3. Enter your 2FA code (required)
4. Confirm — this is irreversible and cascades to all leads, users, and files

### Support Users

Superadmins can create **Support** role users (limited superadmin access for the support team):

1. Go to Console → **Support Users** tab
2. Click **Add support user**
3. Enter email and name
4. The user receives a setup email

### Platform AI Agent Interval

The superadmin can set the platform-wide default agent interval (used by any org that hasn't set its own). This is done via **Settings → AI Agents** while logged in as superadmin.

---

## 12. Mobile App

SalesFlow CRM has a native Flutter app for iOS and Android, optimised for voice capture and lead review on the go.

### Installing (iOS)

*(App Store submission in progress — TestFlight build available on request)*

### Installing (Android)

*(Play Store submission in progress — APK available on request)*

### Mobile Features

| Feature | Available |
|---------|-----------|
| Voice capture | ✅ |
| View leads | ✅ |
| Update lead stage | ✅ |
| View messages | ✅ |
| AI agent output | ✅ |
| Admin settings | ❌ (desktop only) |
| Kanban board | ❌ (desktop only) |

### Voice Capture on Mobile

1. Open the app and tap the **microphone** button
2. Grant microphone permission
3. Tap **Record** — a pulsing animation shows it's listening
4. Tap **Stop**
5. AI extracts the lead — review and edit fields
6. Tap **Save**

---

## 13. Roles & Permissions

| Permission | Agent | Admin | Support | Superadmin |
|-----------|-------|-------|---------|------------|
| View own leads | ✅ | ✅ | ❌ | ❌ |
| View all org leads | ❌ | ✅ | ❌ | ❌ |
| Create/edit leads | ✅ | ✅ | ❌ | ❌ |
| Delete leads | ❌ | ✅ | ❌ | ❌ |
| Manage team | ❌ | ✅ | ❌ | ❌ |
| Manage branding | ❌ | ✅ | ❌ | ❌ |
| Configure AI agents | ❌ | ✅ | ❌ | ❌ |
| Kanban board | ❌ | ✅ | ❌ | ❌ |
| View all organisations | ❌ | ❌ | ✅ | ✅ |
| Delete organisations | ❌ | ❌ | ❌ | ✅ |
| Create support users | ❌ | ❌ | ❌ | ✅ |
| Developer portal (/dev) | ❌ | ❌ | ❌ | ✅* |

*\*Dev portal is separately gated by `DEV_SECRET`, not user role.*

---

## 14. FAQ & Troubleshooting

**I can't log in — it says my email or password is not recognised.**  
Double-check your email address for typos. Passwords are case-sensitive. If you've forgotten your password, contact your admin.

**The CAPTCHA isn't showing on the login page.**  
Try refreshing the page. If it still doesn't appear, disable any browser extensions that block third-party scripts (ad blockers can interfere with Cloudflare Turnstile).

**I recorded a voice note but the lead details are wrong.**  
AI extraction is not perfect. Always review the extracted fields before saving. You can edit any field on the review screen before clicking Save.

**My notifications aren't appearing.**  
Check that your browser has notification permission for the site (usually in the browser's address bar → padlock icon → Notifications). Also check **Settings → Notifications** to ensure you have the right notifications enabled.

**I can't see some leads that I know exist.**  
Agents can only see leads assigned to them. Ask your admin to check the lead assignment, or ask them to reassign it to you.

**An AI agent ran but I don't see any output.**  
Check the **AI tab** on the specific lead. Agent output only appears there and on the Dashboard. If it's blank, the agent may have encountered an error — ask your admin to check the agent logs.

**The page is very slow.**  
SalesFlow CRM runs on a starter hosting plan. If you're regularly experiencing slowness during business hours, contact your admin about upgrading the hosting plan.

**How do I export all my leads?**  
Go to **Leads → ⋮ menu → Export to CSV**. This exports all leads visible to you.

**I accidentally deleted a lead — can it be recovered?**  
Lead deletion is permanent. Admins can check the Audit Log to confirm what was deleted and by whom, but the data cannot be automatically restored. Raise this with your superadmin for a database-level recovery if needed.

**Who do I contact for support?**  
Contact your organisation admin first. For platform-level issues, the superadmin can raise a support ticket or use the Console's Request Access feature to investigate.

---

## Appendix: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `N` | New lead (when on Leads page) |
| `Esc` | Close any modal |
| `/` | Focus the search bar |

---

*This manual is maintained in the [SalesFlow CRM GitHub repository](https://github.com/sudeepmathur79/CRM/blob/main/docs/USER_MANUAL.md). To suggest corrections or additions, open an issue or PR on GitHub.*
