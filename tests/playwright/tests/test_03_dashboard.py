"""
Test 03 — Dashboard
Verifies the admin dashboard renders KPI cards, conversion funnel,
and today's date after authenticated navigation.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))
from helpers.auth import inject_admin, assert_authenticated_page

BASE_URL = "https://crm-staging-sn50.onrender.com"


def test_dashboard_kpi_cards_visible(page):
    inject_admin(page)
    assert_authenticated_page(page, "/")

    heading = page.locator("h1, h2").filter(has_text="Dashboard")
    from playwright.sync_api import expect
    expect(heading.first).to_be_visible(timeout=5_000)

    kpi_numbers = page.locator(".text-2xl.font-bold, .text-3xl.font-bold")
    assert kpi_numbers.count() >= 3, \
        f"Expected at least 3 KPI cards, found {kpi_numbers.count()}"

    funnel = page.locator("text=Conversion Funnel")
    assert funnel.count() > 0, "Conversion Funnel section not found"


def test_dashboard_shows_todays_date(page):
    from datetime import datetime
    inject_admin(page)
    assert_authenticated_page(page, "/")

    from playwright.sync_api import expect
    month = datetime.now().strftime("%B")
    date_text = page.locator(f"text={month}").first
    expect(date_text).to_be_visible(timeout=5_000)


def test_dashboard_get_started_checklist(page):
    inject_admin(page)
    assert_authenticated_page(page, "/")

    checklist = page.locator("text=Get started")
    assert checklist.count() > 0, "Onboarding 'Get started' checklist not found"
