"""
Test 07 — Agent RBAC
Verifies that an agent (Gopal) only sees their own leads,
cannot access Settings team management, and Smart Add is available.
"""
import sys, requests
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))
from helpers.auth import inject_agent, assert_authenticated_page

BASE_URL = "https://crm-staging-sn50.onrender.com"


def test_agent_can_access_leads_page(page):
    from playwright.sync_api import expect
    inject_agent(page)
    assert_authenticated_page(page, "/leads")

    heading = page.locator("h1").filter(has_text="Leads").first
    expect(heading).to_be_visible(timeout=5_000)


def test_agent_smart_add_visible(page):
    """Regression: Smart Add was admin-only, now available to all roles."""
    from playwright.sync_api import expect
    inject_agent(page)
    assert_authenticated_page(page, "/leads")

    smart_add = page.locator("button", has_text="Smart Add").first
    expect(smart_add).to_be_visible(timeout=5_000)


def test_agent_sees_only_own_leads(page):
    """API-level check: agent token returns only their assigned leads."""
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "gopal2@crm.com", "password": "gopal_user"},
        timeout=45,
    )
    token = resp.json().get("accessToken")
    assert token, "Agent login failed"
    gopal_id = resp.json().get("user", {}).get("id")

    leads_resp = requests.get(
        f"{BASE_URL}/api/leads",
        headers={"Authorization": f"Bearer {token}"},
        timeout=30,
    )
    leads = leads_resp.json()
    assert isinstance(leads, list), f"Expected list, got: {leads}"

    for lead in leads:
        assert lead.get("assignedToId") == gopal_id, \
            f"Lead '{lead.get('name')}' is not assigned to Gopal — RBAC breach"


def test_agent_no_settings_team_tab(page):
    """Agent should not see Team Members in Settings."""
    inject_agent(page)
    assert_authenticated_page(page, "/settings")

    team_tab = page.locator("button", has_text="Team Members")
    if team_tab.count() > 0:
        assert not team_tab.first.is_visible(), \
            "Team Members tab is visible to agent — RBAC regression"
