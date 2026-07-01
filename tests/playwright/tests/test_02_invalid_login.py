"""
Test 02 — Invalid login rejected
Verifies wrong credentials produce an error state.
Staging Turnstile times out after 12s and disappears — we wait for that
before submitting so the form is unblocked.
"""
import sys
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))

BASE_URL = "https://crm-staging-sn50.onrender.com"


def test_invalid_credentials_rejected(page):
    page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=60_000)

    # Wait up to 15s for Turnstile to either succeed or time out
    # The fallback "Try again" message appears when captchaFailed = true
    # Either way, the submit button becomes usable
    page.wait_for_timeout(13_000)  # 13s — just past the 12s timeout fallback

    email_input = page.locator("input[type='email']")
    password_input = page.locator("input[type='password']")
    submit_btn = page.locator("button[type='submit']")

    email_input.fill("nobody@fake-domain-xyz.com")
    password_input.fill("WrongPassword999!")

    submit_btn.click()

    # Wait for error state — either a toast or inline error
    # The API returns {"error": "Invalid credentials"} which triggers a toast/alert
    page.wait_for_timeout(3_000)

    # Page should still be /login (not redirected)
    assert "/login" in page.url, f"Unexpected redirect to {page.url} — login should have failed"

    # No accessToken should be in localStorage
    token = page.evaluate("localStorage.getItem('accessToken')")
    assert token is None, f"accessToken found in localStorage after failed login: {token}"
