"""
Test 05 — Kanban Board
Verifies all pipeline columns render and the board heading is present.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))
from helpers.auth import inject_admin, assert_authenticated_page

BASE_URL = "https://crm-staging-sn50.onrender.com"

EXPECTED_STAGES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Closed Won"]


def test_kanban_page_loads(page):
    inject_admin(page)
    assert_authenticated_page(page, "/kanban")

    heading = page.locator("h1").filter(has_text="Kanban")
    from playwright.sync_api import expect
    expect(heading.first).to_be_visible(timeout=5_000)


def test_kanban_all_columns_present(page):
    inject_admin(page)
    assert_authenticated_page(page, "/kanban")

    for stage in EXPECTED_STAGES:
        col = page.locator(f"text={stage}").first
        assert col.is_visible(), \
            f"Kanban column '{stage}' not found — pipeline stage may be missing"


def test_kanban_new_lead_button_visible(page):
    inject_admin(page)
    assert_authenticated_page(page, "/kanban")

    new_lead_btn = page.locator("button", has_text="New Lead")
    assert new_lead_btn.count() > 0, "New Lead button not found on Kanban board"
