import os
import time
import requests
import pytest
from pathlib import Path
from playwright.sync_api import sync_playwright

EVIDENCE_DIR = Path(__file__).parent / "evidence"
EVIDENCE_DIR.mkdir(exist_ok=True)

BASE_URL = "https://crm-staging-sn50.onrender.com"


# ---------------------------------------------------------------------------
# Session-level warm-up — wakes Render cold-start ONCE before any tests run
# ---------------------------------------------------------------------------
@pytest.fixture(scope="session", autouse=True)
def warmup_staging():
    """Ping staging until it responds (Render free tier cold-starts can take 60s+)."""
    print("\n  🔥 Warming up staging server...")
    deadline = time.time() + 120  # max 2 minutes
    while time.time() < deadline:
        try:
            r = requests.get(f"{BASE_URL}/login", timeout=10, allow_redirects=True)
            if r.status_code < 500:
                print(f"  ✅ Staging ready (HTTP {r.status_code})")
                return
        except Exception:
            pass
        time.sleep(5)
    print("  ⚠️  Staging warm-up timed out — proceeding anyway")

# ---------------------------------------------------------------------------
# Browser fixture — headless by default; set HEADED=1 env var for headed mode
# ---------------------------------------------------------------------------
@pytest.fixture(scope="function")
def page():
    headed = os.environ.get("HEADED", "0") == "1"
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=not headed,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            # Ignore HTTPS errors in case staging cert lags
            ignore_https_errors=True,
        )
        context.set_default_timeout(60_000)   # 60s — accounts for Render cold-start
        pg = context.new_page()
        yield pg
        context.close()
        browser.close()


# ---------------------------------------------------------------------------
# Auto-screenshot after every test (pass AND fail)
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def screenshot_on_finish(request, page):
    yield
    test_name = request.node.name
    outcome = "PASS" if request.node.rep_call.passed else "FAIL"
    filename = EVIDENCE_DIR / f"{outcome}_{test_name}.png"
    try:
        page.screenshot(path=str(filename), full_page=True)
        print(f"\n  📸 Evidence: {filename}")
    except Exception as e:
        print(f"\n  ⚠️  Screenshot failed: {e}")


# Make test outcome available to the screenshot fixture
@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)
