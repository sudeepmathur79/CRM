import requests

BASE_URL = "https://crm-staging-sn50.onrender.com"

ADMIN_EMAIL    = "demoadmin@salesflow.demo"
ADMIN_PASSWORD = "Demo@2026"
AGENT_EMAIL    = "gopal2@crm.com"
AGENT_PASSWORD = "gopal_user"
DEV_SECRET     = "CRM4Devs-staging@2026"


def get_token(email: str, password: str) -> str:
    """Hit the login API directly (bypasses Turnstile) and return accessToken."""
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password},
        timeout=45,
    )
    data = resp.json()
    token = data.get("accessToken")
    assert token, f"Login failed for {email}: {data}"
    return token


def get_dev_token() -> str:
    resp = requests.post(
        f"{BASE_URL}/api/dev/auth",
        json={"secret": DEV_SECRET},
        timeout=45,
    )
    data = resp.json()
    token = data.get("token")
    assert token, f"Dev portal auth failed: {data}"
    return token


def inject_auth(page, email: str, password: str):
    """
    Pre-seed localStorage with a valid accessToken via add_init_script().
    Runs BEFORE React initialises on every navigation — AuthContext finds
    the token immediately on mount and skips the /welcome redirect.

    Requires the App.jsx loading-guard fix (AppRoutes checks loading before
    rendering routes) to be deployed on the target environment.
    """
    token = get_token(email, password)
    page.context.add_init_script(f"""
        window.localStorage.setItem('accessToken', '{token}');
    """)


def inject_admin(page):
    inject_auth(page, ADMIN_EMAIL, ADMIN_PASSWORD)


def inject_agent(page):
    inject_auth(page, AGENT_EMAIL, AGENT_PASSWORD)


def assert_authenticated_page(page, expected_path: str, timeout: int = 30_000):
    """
    Navigate to a protected page and assert we land on it (not /welcome or /login).
    Gives a clear failure message if auth injection didn't work.
    """
    page.goto(f"{BASE_URL}{expected_path}", wait_until="networkidle", timeout=timeout)
    current = page.url
    assert "/welcome" not in current and "/login" not in current, (
        f"Auth injection failed — redirected to {current} instead of {expected_path}. "
        f"Ensure the App.jsx loading-guard fix is deployed on staging."
    )
