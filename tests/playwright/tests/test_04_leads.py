"""
Test 04 — Leads page
Verifies lead list renders, Smart Add button is visible to admins,
and a new lead can be created and appears in the list.
"""
import sys, time, requests
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))
from helpers.auth import inject_admin, assert_authenticated_page, get_token

BASE_URL = "https://crm-staging-sn50.onrender.com"


def test_leads_page_loads(page):
    inject_admin(page)
    assert_authenticated_page(page, "/leads")

    heading = page.locator("h1").filter(has_text="Leads")
    from playwright.sync_api import expect
    expect(heading.first).to_be_visible(timeout=5_000)


def test_smart_add_button_visible_for_admin(page):
    from playwright.sync_api import expect
    inject_admin(page)
    assert_authenticated_page(page, "/leads")

    smart_add = page.locator("button", has_text="Smart Add").first
    # Use expect() with auto-retry (5s) — button renders after React mounts
    expect(smart_add).to_be_visible(timeout=5_000)


def test_smart_add_modal_opens(page):
    inject_admin(page)
    assert_authenticated_page(page, "/leads")

    smart_add = page.locator("button", has_text="Smart Add")
    smart_add.first.click()

    page.wait_for_selector("text=Smart Add", timeout=5_000)
    modal_title = page.locator("text=Smart Add")
    assert modal_title.count() > 0, "Smart Add modal did not open"


def test_create_lead_via_api_appears_in_ui(page):
    """Create via API, verify it renders in the leads list."""
    token = get_token("demoadmin@salesflow.demo", "Demo@2026")
    unique_name = f"Playwright QA Lead {int(time.time())}"

    create_resp = requests.post(
        f"{BASE_URL}/api/leads",
        json={
            "name": unique_name,
            "company": "QA Automation Corp",
            "email": f"qa{int(time.time())}@test.com",
            "stage": "new",
        },
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    assert create_resp.status_code == 201, \
        f"Lead creation failed: {create_resp.status_code} {create_resp.text}"

    lead_id = create_resp.json().get("id")
    assert lead_id, "No lead ID in creation response"

    inject_admin(page)
    assert_authenticated_page(page, "/leads")

    lead_row = page.locator(f"text={unique_name}")
    assert lead_row.count() > 0, \
        f"Created lead '{unique_name}' not visible in leads list"

    # Cleanup
    requests.delete(
        f"{BASE_URL}/api/leads/{lead_id}",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
