"""
Test 01 — Login page structure
Verifies the public login page renders correctly with all required fields.
No auth required. No CAPTCHA interaction.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))

BASE_URL = "https://crm-staging-sn50.onrender.com"


def test_login_page_loads(page):
    page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=60_000)

    # Brand name visible
    brand = page.locator("text=SalesFlow CRM")
    assert brand.count() > 0, "Brand name 'SalesFlow CRM' not found on login page"

    # Email input present
    email_input = page.locator("input[type='email']")
    assert email_input.count() == 1, "Email input not found"

    # Password input present
    password_input = page.locator("input[type='password']")
    assert password_input.count() == 1, "Password input not found"

    # Submit button present and enabled
    submit_btn = page.locator("button[type='submit']")
    assert submit_btn.count() == 1, "Submit button not found"
    assert submit_btn.is_enabled(), "Submit button is disabled"

    # Sign up link present
    signup_link = page.locator("text=Start free trial")
    assert signup_link.count() > 0, "'Start free trial' link not found"

    # Forgot password link present
    forgot_link = page.locator("text=Forgot password")
    assert forgot_link.count() > 0, "Forgot password link not found"
