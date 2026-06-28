# SalesFlow — Go-To-Market Strategy
Last updated: 2026-06-27

---

## 1. Name Analysis

| Name | Memorability | Domain odds | Category clarity | Differentiation | Score |
|------|-------------|-------------|-----------------|-----------------|-------|
| **Fieldnote** | High — concrete, visual | Good | Strong (field = mobile, note = capture) | High — owns the "field" positioning | ⭐ 9/10 |
| SalesFlow | Medium — generic | Poor (.com likely taken) | Weak — reads like a Salesforce feature | Low | 6/10 |
| CaptureIQ | Medium | Fair | Good | Medium | 7/10 |
| MeetingMind | Low — overused pattern | Poor | Medium | Low | 5/10 |
| Voicelog | Medium | Fair | Good | Medium | 6/10 |

**Recommendation: Fieldnote**
"SalesFlow" reads like a Salesforce feature or pipeline dashboard. Fieldnote owns a clear identity — mobile, rep-centric, capture-focused. It works as a verb ("I'll fieldnote that") which is the holy grail for bottoms-up SaaS adoption.

---

## 2. ICP Pain Points (in their language)

**Primary ICP: Field sales reps, SMB owner-sellers**

1. "I spend Sunday nights updating Salesforce instead of being with my family."
2. "I forget what we talked about by the time I get back to my car."
3. "My pipeline is always out of date because logging takes too long after a full day of meetings."
4. "I've tried voice memos but they just sit there — I still have to type everything up."
5. "My manager asks why the CRM isn't updated. I'm out here doing 8 meetings a day."

**Secondary ICP: Sales managers**
1. "I can't coach my reps because I have no visibility into what's actually happening in meetings."
2. "Pipeline data is fiction — it reflects what reps remembered to log, not what actually happened."

---

## 3. Messaging Hierarchy

**Hero headline:**
> Your meetings, logged. Automatically.

**Subheadline:**
> Speak naturally after every call. SalesFlow captures, extracts, and updates your CRM — no typing required.

**Feature benefit statements:**

| Problem | Solution |
|---------|----------|
| "I forget details by the time I'm back at my desk" | Capture notes in 30 seconds while still in the car park |
| "CRM updates eat my evenings" | Every call auto-logged — name, company, deal value, next step |
| "My tools don't talk to each other" | Pushes directly to HubSpot, Salesforce, Zoho, or your own pipeline |

**Social proof hook (format):**
> "{First name}, {role} at {company type}, closed {X}% more deals after eliminating {Y} hours of weekly CRM admin.

---

## 4. Channel Strategy (30-day plan)

### LinkedIn (organic)
- **Week 1–2:** Post 3× per week — pure pain articulation. No product mention.
  - "Hot take: your CRM data is fiction. Here's why field reps lie to their pipeline (and it's not laziness)."
  - "I asked 20 sales reps how long they spend on CRM updates per week. The answers were depressing."
- **Week 3:** Introduce the problem/solution narrative. Still soft — "we're building something for this."
- **Week 4:** Launch post with product demo video. Link to waitlist/signup.
- **Target:** Connect with field sales reps and SMB founders. Engage on their posts first.

### Reddit
- **r/sales, r/entrepreneur, r/smallbusiness**
- **Week 1:** Post a genuine question thread — "How do you handle CRM updates after a full day of field meetings?" Gather responses, engage authentically.
- **Week 2:** Share a useful non-promotional resource — e.g. "I built a voice capture workflow using free tools — here's how" (shows the pain, hints at the solution).
- **Week 3–4:** After building karma and credibility, share "I built a tool that solves this — here's the backstory" post. Link in comments only if asked.
- **Rule:** Never post promotional content in week 1. Reddit will bury it and you'll be banned.

### Product Hunt
- **Launch in Week 3** (after LinkedIn and Reddit presence established)
- Hunter: find a PH top hunter to post on your behalf (+500 upvotes on average vs self-posting)
- Assets needed: 60-second demo GIF, 3 screenshots, tagline, maker comment
- **Tagline:** "Never manually update your CRM again"
- Launch on a Tuesday or Wednesday (highest traffic)
- Prep 20+ supporters to upvote in first 2 hours — critical for algorithm

### Cold outreach (LinkedIn DM)
Target: Field sales reps at 10–200 person companies, visible on LinkedIn ("Field Sales Representative", "Account Executive - SMB", "Territory Sales Manager")

**3-message sequence:**

Message 1 (day 1):
> "Hey {name} — genuine question: how do you handle CRM updates after a full day of field meetings? I'm researching this and curious what the reality looks like for people actually doing it."

Message 2 (day 4, if replied):
> "That's exactly what I hear from most reps — Sunday nights or it doesn't happen. We're building something to fix this. Would you be up for a 10-min Zoom to tell me what would actually make your life easier?"

Message 3 (after call — or day 7 if no reply to message 2):
> "Built a quick demo based on conversations like yours. Free to try — no credit card. Happy to set it up for you if you want a hand: {link}"

**Volume:** 20 DMs/day. Expect 15–20% reply rate on message 1 from a well-targeted list.

---

## 5. Pricing Structure

### Free — $0/month
- 10 voice captures per month (forever)
- 1 user
- Internal pipeline only (no external CRM sync)
- Watermark on BCC exports: "Powered by SalesFlow"
- **Goal:** Habit formation. Hit the cap mid-deal = maximum upgrade motivation.

### Pro — $29/seat/month (billed monthly) or $24/seat/month (billed annually)
- Unlimited voice captures
- HubSpot + Salesforce + Zoho sync
- AI lead scoring
- Follow-up reminders
- **Sits below ~$50 expense-without-approval threshold for most US companies**

### Team — $19/seat/month (min 5 seats, billed annually)
- Everything in Pro
- Manager dashboard + agent performance view
- Team leaderboard
- Priority support
- **Sell to the manager after the rep is already hooked**

---

## 6. Launch Sequence (Weeks 1–4)

### Week 1 — Foundation
- [ ] LinkedIn: 3 pain-point posts (no product)
- [ ] Reddit: 2 genuine question threads
- [ ] Cold outreach: 20 DMs/day to field reps
- [ ] Set up PostHog to track signups and feature usage
- [ ] Set up UptimeRobot for uptime alerts

### Week 2 — Warm-up
- [ ] LinkedIn: 3 posts — start hinting at solution
- [ ] Reddit: Share non-promotional resource post
- [ ] Cold outreach: Follow up on week 1 DMs
- [ ] Book 5 user interviews from outreach responses
- [ ] Incorporate interview feedback into landing page copy

### Week 3 — Launch
- [ ] Product Hunt launch (Tuesday)
- [ ] LinkedIn: Launch post with demo video
- [ ] Reddit: "I built this" post in r/entrepreneur
- [ ] Email any waitlist signups
- [ ] Cold outreach: Send demo links to warm prospects

### Week 4 — Convert
- [ ] Follow up with everyone who signed up but didn't capture
- [ ] Post a "Week 1 lessons" LinkedIn post (builds credibility)
- [ ] Identify first 3 paying customers — offer white-glove onboarding
- [ ] Start building case study from early users

---

## Key Metrics to Track (PostHog)

| Metric | Target (Month 1) |
|--------|-----------------|
| Landing page visitors | 500+ |
| Signups | 50+ |
| Activated users (≥1 capture) | 30+ |
| Paid conversions | 5+ |
| Avg captures per active user/week | 3+ |
