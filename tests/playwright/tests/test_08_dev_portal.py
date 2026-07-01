"""
Test 08 — Dev Portal
Full coverage of dev portal features: login, backlog, CRUD, AI prioritise,
branch status, test status, drag-and-drop, and ship gate.
"""
import sys, time, requests
sys.path.insert(0, str(__import__('pathlib').Path(__file__).parent.parent))
from playwright.sync_api import expect

BASE_URL   = "https://crm-staging-sn50.onrender.com"
DEV_SECRET = "CRM4Devs-staging@2026"


# ── Shared helper ─────────────────────────────────────────────────────────────

def dev_login(page):
    """Log in to dev portal and wait for the board to render."""
    page.goto(f"{BASE_URL}/dev", wait_until="networkidle", timeout=60_000)
    secret_input = page.locator("input[type='password'], input[type='text']").first
    secret_input.fill(DEV_SECRET)
    page.locator("button[type='submit']").first.click()
    page.wait_for_selector("text=Backlog", timeout=20_000)


def dev_api(method, path, **kwargs):
    """Direct API call to dev endpoints using the staging DEV_SECRET."""
    return requests.request(
        method,
        f"{BASE_URL}/api/dev{path}",
        headers={"Authorization": f"Bearer {DEV_SECRET}"},
        timeout=30,
        **kwargs,
    )


# ── Login ─────────────────────────────────────────────────────────────────────

def test_dev_portal_login(page):
    page.goto(f"{BASE_URL}/dev", wait_until="networkidle", timeout=60_000)
    secret_input = page.locator("input[type='password'], input[type='text']").first
    assert secret_input.is_visible(), "Dev portal login input not found"

    secret_input.fill(DEV_SECRET)
    page.locator("button[type='submit']").first.click()
    expect(page.locator("text=Backlog").first).to_be_visible(timeout=20_000)


def test_dev_portal_rejects_wrong_secret(page):
    page.goto(f"{BASE_URL}/dev", wait_until="networkidle", timeout=60_000)
    secret_input = page.locator("input[type='password'], input[type='text']").first
    secret_input.fill("wrong-secret-xyz")
    page.locator("button[type='submit']").first.click()
    page.wait_for_timeout(2_000)
    # Should still be on login page — no board
    board = page.locator("text=Backlog")
    assert board.count() == 0, "Dev portal accepted wrong secret — auth bypass"


# ── Board ─────────────────────────────────────────────────────────────────────

def test_dev_portal_action_buttons_present(page):
    dev_login(page)
    expect(page.locator("button", has_text="AI Prioritise").first).to_be_visible(timeout=5_000)
    expect(page.locator("button", has_text="Take Over").first).to_be_visible(timeout=5_000)
    expect(page.locator("button", has_text="Deploy Now").first).to_be_visible(timeout=5_000)
    expect(page.locator("button", has_text="Push to Production").first).to_be_visible(timeout=5_000)


def test_dev_portal_all_columns_present(page):
    dev_login(page)
    for col in ["Backlog", "Ready", "In Progress", "Review", "Done"]:
        expect(page.locator(f"text={col}").first).to_be_visible(timeout=5_000)


def test_dev_portal_backlog_has_items(page):
    dev_login(page)
    expect(page.locator("text=items").first).to_be_visible(timeout=5_000)
    # At least one kanban card should be visible
    cards = page.locator(".bg-slate-800.border.border-slate-700.rounded-xl")
    assert cards.count() > 0, "No kanban cards visible on dev portal board"


# ── CRUD ──────────────────────────────────────────────────────────────────────

def test_create_item_via_api_appears_on_board(page):
    """Create an item via API, verify it shows on the board."""
    unique_title = f"Playwright Test Item {int(time.time())}"
    resp = dev_api("POST", "/items", json={
        "title": unique_title,
        "epic": "Developer Portal",
        "priority": 2,
        "effort": "S",
        "status": "backlog",
        "tags": ["frontend"],
    })
    assert resp.status_code == 201, f"Item creation failed: {resp.text}"
    item_id = resp.json()["id"]

    dev_login(page)
    expect(page.locator(f"text={unique_title}").first).to_be_visible(timeout=8_000)

    # Cleanup
    dev_api("DELETE", f"/items/{item_id}")


def test_update_item_status_via_api(page):
    """Move an item to 'ready' via API, verify the board reflects it."""
    resp = dev_api("POST", "/items", json={
        "title": f"Status Test {int(time.time())}",
        "status": "backlog",
        "priority": 3,
        "effort": "XS",
    })
    assert resp.status_code == 201
    item = resp.json()

    patch = dev_api("PATCH", f"/items/{item['id']}", json={"status": "ready"})
    assert patch.status_code == 200
    assert patch.json()["status"] == "ready"

    dev_login(page)
    # Item title should be visible in Ready column area
    expect(page.locator(f"text={item['title']}").first).to_be_visible(timeout=8_000)

    dev_api("DELETE", f"/items/{item['id']}")


# ── Drag-and-drop ─────────────────────────────────────────────────────────────

def test_drag_card_changes_status(page):
    """Drag a card from Backlog to Ready and verify the status update persists."""
    unique_title = f"Drag Test {int(time.time())}"
    resp = dev_api("POST", "/items", json={
        "title": unique_title,
        "status": "backlog",
        "priority": 3,
        "effort": "XS",
    })
    assert resp.status_code == 201
    item_id = resp.json()["id"]

    dev_login(page)

    # Locate the card and the Ready column drop target
    card = page.locator(f"text={unique_title}").first
    expect(card).to_be_visible(timeout=8_000)

    ready_col = page.locator("text=Ready").first
    expect(ready_col).to_be_visible()

    # Drag card to Ready column header (dnd-kit delay=150ms — hold before moving)
    card_box = card.bounding_box()
    ready_box = ready_col.bounding_box()

    assert card_box, "Card has no bounding box"
    assert ready_box, "Ready column has no bounding box"

    page.mouse.move(card_box["x"] + card_box["width"] / 2, card_box["y"] + card_box["height"] / 2)
    page.mouse.down()
    page.wait_for_timeout(200)  # hold past the 150ms delay activation constraint
    page.mouse.move(ready_box["x"] + ready_box["width"] / 2, ready_box["y"] + 40, steps=10)
    page.wait_for_timeout(100)
    page.mouse.up()
    page.wait_for_timeout(1_500)  # wait for API PATCH to complete

    # Verify API persisted the status change
    status_resp = dev_api("GET", "/items")
    items = status_resp.json()
    updated = next((i for i in items if i["id"] == item_id), None)
    assert updated is not None, "Item not found in API response after drag"
    assert updated["status"] == "ready", \
        f"Drag did not persist: item status is '{updated['status']}', expected 'ready'"

    dev_api("DELETE", f"/items/{item_id}")


# ── AI Prioritise ─────────────────────────────────────────────────────────────

def test_ai_prioritise_returns_suggestions(page):
    """Click AI Prioritise — verify suggestion badges appear on cards."""
    dev_login(page)
    ai_btn = page.locator("button", has_text="AI Prioritise").first
    ai_btn.click()

    # Wait for AI response (up to 30s — Groq can be slow)
    page.wait_for_timeout(2_000)
    # Suggestion badge uses indigo styling
    suggestion = page.locator(".bg-indigo-950\\/60").first
    expect(suggestion).to_be_visible(timeout=30_000)


# ── Branch + test status (new Ship It feature) ────────────────────────────────

def test_branch_status_api_responds(page):
    """Branch status endpoint returns ahead/behind counts."""
    resp = dev_api("GET", "/branch-status")
    assert resp.status_code == 200, f"branch-status failed: {resp.text}"
    data = resp.json()
    assert "ahead" in data or "error" in data, f"Unexpected response shape: {data}"


def test_test_status_api_responds(page):
    """Test status endpoint returns CI run info."""
    resp = dev_api("GET", "/test-status")
    assert resp.status_code == 200, f"test-status failed: {resp.text}"
    data = resp.json()
    assert "status" in data, f"No status field in response: {data}"
    # Valid statuses
    valid = {"success", "failure", "in_progress", "queued", "never_run", "unknown"}
    assert data["status"] in valid, f"Unexpected status value: {data['status']}"


def test_push_to_production_modal_opens(page):
    """Push to Production button opens modal with branch status."""
    dev_login(page)
    push_btn = page.locator("button", has_text="Push to Production").first
    expect(push_btn).to_be_visible(timeout=5_000)
    push_btn.click()

    # Modal should show branch status section
    expect(page.locator("text=dev vs main").first).to_be_visible(timeout=8_000)
    # Ship It button should be present (may be disabled if tests haven't passed)
    expect(page.locator("button", has_text="Ship It").first).to_be_visible(timeout=5_000)
