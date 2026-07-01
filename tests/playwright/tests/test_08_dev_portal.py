"""
Test 08 — Dev Portal
Verifies dev portal login, backlog renders, and key action buttons are present.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))

BASE_URL = "https://crm-staging-sn50.onrender.com"
DEV_SECRET = "CRM4Devs-staging@2026"


def test_dev_portal_login(page):
    page.goto(f"{BASE_URL}/dev", wait_until="networkidle")

    # Should show a secret input / login prompt
    secret_input = page.locator("input[type='password'], input[type='text']").first
    assert secret_input.count() > 0 or secret_input.is_visible(), \
        "Dev portal login input not found"

    secret_input.fill(DEV_SECRET)

    submit = page.locator("button[type='submit']").first
    submit.click()

    # Wait for the backlog board to appear
    page.wait_for_selector("text=Backlog", timeout=15_000)

    backlog_heading = page.locator("text=Backlog")
    assert backlog_heading.count() > 0, "Dev portal backlog not rendered after login"


def test_dev_portal_action_buttons_present(page):
    # Login first
    page.goto(f"{BASE_URL}/dev", wait_until="networkidle")
    secret_input = page.locator("input[type='password'], input[type='text']").first
    secret_input.fill(DEV_SECRET)
    page.locator("button[type='submit']").first.click()
    page.wait_for_selector("text=Backlog", timeout=15_000)

    # AI Prioritise button
    ai_prio = page.locator("button", has_text="AI Prioritise")
    assert ai_prio.count() > 0, "AI Prioritise button not found"

    # Take Over button
    takeover = page.locator("button", has_text="Take Over")
    assert takeover.count() > 0, "Take Over button not found"

    # Deploy Now button
    deploy = page.locator("button", has_text="Deploy Now")
    assert deploy.count() > 0, "Deploy Now button not found"

    # Push to Production button
    push = page.locator("button", has_text="Push to Production")
    assert push.count() > 0, "Push to Production button not found"


def test_dev_portal_backlog_has_items(page):
    page.goto(f"{BASE_URL}/dev", wait_until="networkidle")
    secret_input = page.locator("input[type='password'], input[type='text']").first
    secret_input.fill(DEV_SECRET)
    page.locator("button[type='submit']").first.click()
    page.wait_for_selector("text=Backlog", timeout=15_000)

    # Item count shown in header (e.g. "23 items · 21 done")
    item_count = page.locator("text=items")
    assert item_count.count() > 0, "Item count not displayed in dev portal header"

    # Completion percentage
    percentage = page.locator("text=%")
    assert percentage.count() > 0, "Completion percentage not shown"
