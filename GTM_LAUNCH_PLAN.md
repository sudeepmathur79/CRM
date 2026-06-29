# SalesFlow CRM — GTM Launch Plan
**Goal:** 10 paid sign-ups + 500 active engagements by Friday 3 July 2026  
**Budget:** $20 per channel (max 3–4 channels)  
**ICP:** Solopreneurs, independent consultants, SMB founders who sell  
**Platform:** UK-operated, crm-mjky.onrender.com → moving to salesflowcrm.io today

---

## 🔴 Pre-launch blockers (must be done before spending $1)

| # | Task | Owner | Status |
|---|------|--------|--------|
| 1 | Domain live (salesflowcrm.io) pointing to app | You | ⏳ Today |
| 2 | support@salesflowcrm.io email working | You | ⏳ Today |
| 3 | Terms + Privacy updated (multi-jurisdiction) | Done | ✅ |
| 4 | Landing page false claims removed, ICP reframed | Done | ✅ |
| 5 | Stripe operational on Render | Confirmed | ✅ |
| 6 | ICO registration (UK data controller, ~£40) | You | ⏳ This week |
| 7 | RBAC fix verified in production | Build agent | ⏳ P0 |

---

## 📊 Funnel architecture

```
Awareness → Landing page (/welcome)
           ↓
Sign-up → Free account (10 leads/month)
           ↓
Aha moment → AI scores a lead in <45 seconds
           ↓
Upgrade trigger → Hit 10 lead limit OR add voice recording
           ↓
Paid conversion → $29/month Pro
```

**Analytics events we must track (PostHog — already integrated):**
- `page_viewed` (welcome page) ← already firing?
- `signup_started`
- `signup_completed`
- `first_lead_created`
- `ai_score_viewed` ← aha moment
- `voice_capture_attempted`
- `upgrade_modal_opened`
- `checkout_started`
- `checkout_completed`

These events tell us exactly where the 500 drop off. Build agent to add any missing ones.

---

## 📣 Channel plan (week of 29 Jun – 4 Jul)

### Channel 1: LinkedIn organic (£0 budget, your time)
**Goal:** 3 posts, minimum 200 impressions, 5 DMs to warm leads

**Post schedule:**
- **Monday 30 Jun** — Origin story post
  > "I got tired of CRMs that needed a consultant to set up. So I built one.
  > SalesFlow: voice capture → AI scoring → pipeline. 30 seconds to add a lead.
  > Free to try. [link]"
  > Tag: #CRM #solopreneur #salestech #founder

- **Wednesday 2 Jul** — Demo/feature post (screen recording or Loom gif)
  > "Watch me add a lead in 28 seconds using voice capture + AI.
  > No typing. No form. Just speak.
  > [short video or gif]
  > Free at [link]"

- **Friday 4 Jul** — Social proof / milestone post
  > "We hit [X] sign-ups this week. Here's what people are saying..."
  > (Use real feedback from early users)

**DM strategy (warm outreach, not cold spam):**
- Search LinkedIn for: "solopreneur", "freelance consultant", "business development", "SMB sales"
- Filter: 2nd connections in UK/AU/IN/US
- Message template (personalise each one):
  > "Hi [Name] — I saw you're doing [X]. I built a CRM specifically for people who sell without a full sales team — AI lead scoring, voice capture, free to start. Would love your honest feedback. [link]"
- Target: 20 DMs per day, 5 minutes each

### Channel 2: Reddit organic (£0 budget, your time)
**Goal:** 3 posts in high-traffic subreddits, 100+ upvotes, 50 click-throughs

**Target subreddits:**
- r/Entrepreneur (2.4M members) — "Show HN"-style post
- r/smallbusiness (2.1M members) — problem-first post
- r/SaaS (180K) — founder story post
- r/sales (350K) — tool demo post

**Post templates:**

r/Entrepreneur: **"I built a CRM for people who hate CRMs [free to try]"**
> After watching salespeople lose deals because updating their CRM was too annoying, I built SalesFlow. Speak after a meeting, AI extracts the lead. Score of 1–10. Pipeline ready.
> Free tier: 10 captures/month. No CC.
> Would love honest feedback from this community.
> [link]

r/smallbusiness: **"What CRM do you actually use as a small business?"**
> Start a genuine conversation. Reply to everyone. Mention SalesFlow naturally when relevant. Don't lead with it.

**Rules:** Read subreddit rules before posting. Disclose you're the founder. Never spam. One post per subreddit per week.

### Channel 3: LinkedIn Paid (£20 budget)
**Target:** UK/AU solopreneurs + SMB founders, age 28–50, titles: founder, consultant, business development, sales director (small company)
**Format:** Single image ad with social proof quote
**Copy:**
> Headline: "CRM that takes 30 seconds, not 30 minutes"
> Body: "Voice capture → AI scoring → pipeline. Free for 10 leads/month."
> CTA: "Start free →"
**Expected reach at £20:** ~1,500–2,500 impressions, ~15–30 clicks
**Optimise for:** Link clicks to /welcome

### Channel 4: ProductHunt launch (£0)
**When:** Wednesday 2 July (mid-week launches perform better)
**Prep needed:**
- Write tagline: "AI CRM that captures leads by voice — 30 seconds, no typing"
- Write description (250 words max)
- Prepare 3 product screenshots
- Ask 10 friends/network to upvote on launch day (do this in DMs, not mass email)
**Goal:** Top 5 in "Productivity" category → organic reach of 5,000–10,000 product views

---

## 📅 Day-by-day execution plan

### Today (Mon 29 Jun)
- [ ] Point domain (salesflowcrm.io) to Render
- [ ] Set up support@salesflowcrm.io
- [ ] Push legal + landing page changes (already done in code)
- [ ] Deploy to Render (you push, Render auto-deploys)
- [ ] Write LinkedIn origin story post (schedule for 8am Tue)
- [ ] Set up PostHog funnel dashboard

### Tuesday 30 Jun
- [ ] LinkedIn post goes live (8am your time)
- [ ] Send 20 personalised LinkedIn DMs (spend 45 mins)
- [ ] Post in r/Entrepreneur (10am)
- [ ] Reply to ALL comments on Reddit + LinkedIn within 1 hour

### Wednesday 1 Jul
- [ ] ProductHunt launch (12:01am PT = 8am UK)
- [ ] LinkedIn demo video/gif post (8am)
- [ ] Launch LinkedIn paid ad (£20 budget)
- [ ] Post in r/smallbusiness
- [ ] Send 20 more LinkedIn DMs

### Thursday 2 Jul — 4-hour review #1
- Check PostHog funnel: where are people dropping off?
- Check Stripe dashboard: any paid sign-ups?
- Adjust messaging based on what's converting
- Reddit post in r/sales
- Send 20 more LinkedIn DMs

### Friday 4 Jul — Final push
- LinkedIn milestone post
- Review all channels
- DM anyone who signed up to ask for feedback
- Count: target 10 paid, 500 engaged

---

## 📈 Success metrics (4-hour review checkpoints)

| Metric | Target | Track via |
|--------|--------|-----------|
| Landing page unique visitors | 500+ | PostHog |
| Signup rate (visitors → accounts) | >10% | PostHog |
| Aha moment rate (signed up → scored a lead) | >60% | PostHog |
| Free → paid conversion | >2% | Stripe + PostHog |
| LinkedIn post impressions | 500+ per post | LinkedIn Analytics |
| Reddit upvotes total | 100+ | Reddit |
| ProductHunt upvotes | 50+ | ProductHunt |
| Paid sign-ups by Friday | 10 | Stripe |

---

## ⚖️ Compliance checklist before paid spend

- [x] Terms of Service live at /terms
- [x] Privacy Policy live at /privacy (UK GDPR / GDPR / DPDP / Privacy Act compliant)
- [x] Signup page links to both
- [ ] ICO registration (£40, register at ico.org.uk → complete this week)
- [x] No unsubstantiated claims on landing page
- [x] No advertised features that don't exist
- [ ] LinkedIn ad must include "Promoted" label (platform handles this automatically)
- [ ] Reddit posts must disclose founder status
- [x] Cooling-off rights in ToS (14-day UK/EU consumer right)
- [x] Cancellation terms clear in ToS

---

## 🐛 Bugs requiring build agent (pre-GTM)

### P0 — Block team plan sales
**RBAC verification:** Backlog says RBAC is done, but QA audit (26 Jun) found agents see all leads. Verify in production: log in as an agent role, confirm leads list is filtered to assigned only. If not fixed, build agent must patch `leads.routes.js` to filter by `assignedToId` when `role === 'agent'`.

### P1 — Analytics funnel gaps
Add missing PostHog events in frontend:
- `ai_score_viewed` — fire when lead detail page loads and score is displayed
- `upgrade_modal_opened` — fire when upgrade prompt appears
- `voice_capture_attempted` — fire when mic button is tapped
- `checkout_started` — fire when /api/stripe/checkout is called
Without these, we cannot diagnose where the 500 drop off.

### P1 — Domain update
Once salesflowcrm.io is live:
- Update `APP_PUBLIC_URL` env var on Render
- Update Stripe webhook URL in Stripe dashboard
- Update any hardcoded `crm-mjky.onrender.com` references in email templates

### P2 — Email contact address
Terms and Privacy reference `support@salesflowcrm.io` and `privacy@salesflowcrm.io`. These mailboxes must exist before launch. Set up email forwarding to your personal email if using a service like Cloudflare Email Routing or ImprovMX (free tier).

---

## 💰 Budget allocation

| Channel | Spend | Expected reach | Priority |
|---------|-------|----------------|----------|
| LinkedIn organic | £0 | 300–500 impressions | High |
| Reddit organic | £0 | 200–500 impressions | High |
| ProductHunt | £0 | 5,000–10,000 views | Very High |
| LinkedIn paid ad | £20 | 1,500–2,500 impressions | Medium |
| **Total** | **£20** | **7,000–13,500** | |

Note: ProductHunt is the highest-leverage zero-cost channel available. A top-10 finish on launch day can drive more sign-ups than a £200 ad budget. This should be the primary GTM moment.

---

## 🔄 4-hour review template (use at each checkpoint)

```
Time: ___
Visitors to /welcome: ___
Signups: ___
Aha moments (lead scored): ___
Paid conversions: ___

What's working: ___
What's not: ___
Adjustment for next 4 hours: ___
```
