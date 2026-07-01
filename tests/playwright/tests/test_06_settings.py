"""
Test 06 — Settings page
Verifies the Sign Out button is in the PAGE HEADER (top of page),
not buried at the bottom. Regression test for the fix made this session.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))
from helpers.auth import inject_admin, assert_authenticated_page

BASE_URL = "https://crm-staging-sn50.onrender.com"


def test_settings_page_loads(page):
    inject_admin(page)
    assert_authenticated_page(page, "/settings")

    heading = page.locator("h1").filter(has_text="Settings")
    from playwright.sync_api import expect
    expect(heading.first).to_be_visible(timeout=5_000)


def test_sign_out_button_in_header(page):
    """
    Regression: Sign Out must be visible in the Settings header without scrolling.
    """
    inject_admin(page)
    assert_authenticated_page(page, "/settings")

    sign_out = page.locator("button", has_text="Sign out")
    assert sign_out.count() > 0, "Sign Out button not found on Settings page"

    bounding_box = sign_out.first.bounding_box()
    assert bounding_box is not None, "Sign Out button has no bounding box (not rendered)"
    assert bounding_box["y"] < 300, \
        f"Sign Out button is at y={bounding_box['y']}px — not in page header (too far down)"


def test_settings_nav_link_in_sidebar(page):
    inject_admin(page)
    assert_authenticated_page(page, "/")

    settings_link = page.locator("a[href='/settings']")
    assert settings_link.count() > 0, "Settings nav link not found in sidebar"
