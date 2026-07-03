# ShopCount Training Guide

**ShopCount** is an inventory counting app for small grocery stores. It helps staff count products on the shelf, compare counts to expected stock, and flag discrepancies — especially for alcohol and tobacco. This is **not** a cash register or POS system.

**Demo store:** Desi Mart Neighborhood Store  
**Live API:** https://productcount.up.railway.app/api/v1

---

## 1. Who uses ShopCount?

| Role | Typical user | What they do |
|------|--------------|--------------|
| **Staff** | Floor associate | Scan/count products, submit sessions for review |
| **Manager** | Shift lead / supervisor | Review variances, approve restricted items, approve sessions |
| **Owner** | Store owner | Same as manager, plus full visibility and audit history |

### Demo login credentials

All demo accounts use password: **`password123`**

| Role | Email | Name |
|------|-------|------|
| Staff | `staff@desimart.com` | Amit Kumar |
| Manager | `manager@desimart.com` | Priya Sharma |
| Owner | `owner@desimart.com` | Raj Patel |

> **Training tip:** Start trainees on the **Staff** account. Switch to **Manager** for the review module.

---

## 2. Getting started

### Install and open the app

1. Install ShopCount on your phone (TestFlight / internal build) or use **Expo Go** during development.
2. Open the app — you will see the **Login** screen.
3. Enter your email and password.
4. Tap **Sign In**.

On first login, the app downloads the **product catalog**, **categories**, and **locations** to your phone for offline use. Wait for sign-in to complete before counting.

### Bottom navigation

After login, four tabs appear at the bottom:

| Tab | Purpose |
|-----|---------|
| **Dashboard** | Overview, active counts, quick actions |
| **Products** | Browse/search the product catalog (offline) |
| **Counts** | List of all count sessions |
| **Settings** | Sync, connection test, sign out |

---

## 3. Core concepts

### Count session

A **count session** is one inventory count job — for example, “Weekly Full Count” or “Freezer Spot Check.” Each session has:

- A **name** and **type** (Full, Cycle, or Spot)
- Selected **categories** and **locations** (or all)
- A **status** that moves through the workflow (see below)

### Count line

Each **count line** is one product counted at one **location**. Example: “Basmati Rice, Front Shelf, counted 22.”

### Location

Where on the floor the item was counted:

- Front Shelf
- Back Room
- Freezer
- Tobacco Counter
- Liquor Shelf
- Cashier Area

**Always select the correct location before scanning.**

### Expected vs counted vs variance

| Term | Meaning |
|------|---------|
| **Expected** | What the system thinks you should have on hand |
| **Counted** | What staff actually counted |
| **Variance** | Difference (counted − expected) |

**Color codes:**

- **Green** — matches expected (variance = 0)
- **Amber/orange** — overage (counted more than expected)
- **Red** — shortage (counted less than expected)

### Restricted items (alcohol & tobacco)

Products in **Alcohol** or **Tobacco** categories need extra care:

- Edits and variances may require **manager approval**
- Approval is required when variance is **2+ units**, **5%+**, or any **shortage**
- Look for the purple **Alcohol** or **Tobacco** badge on product cards

---

## 4. Count session workflow

```
  Draft  →  In Progress  →  Review  →  Approved  →  Posted
            (counting)      (manager)   (manager)    (final)
```

| Status | Who acts | What happens |
|--------|----------|--------------|
| **Draft** | Staff/Manager | Session created, not started |
| **In Progress** | Staff | Counting with scan or manual entry |
| **Review** | Manager | Staff submitted; manager checks variances |
| **Approved** | Manager | Session signed off |
| **Posted** | System | Final; no more edits |

---

## 5. Staff training: daily counting

### Step 1 — Start from the Dashboard

1. Open **Dashboard**.
2. Check **Active Sessions** or tap **+ New** to create one.
3. Tap an existing session to open it.

### Step 2 — Create a count session (if needed)

1. Tap **+ New** on Dashboard or go to **Counts → Create**.
2. Enter a **Session Name** (e.g. “Monday Freezer Count”).
3. Choose **Count Type**:
   - **Full** — entire store / all categories
   - **Cycle** — rotating section (e.g. one aisle per day)
   - **Spot** — quick check of specific items
4. Optionally filter **Categories** and **Locations** (leave blank to include all).
5. Tap **Create Count Session**.

### Step 3 — Open the session and start counting

1. On the session detail screen, review progress bar and recent counts.
2. Tap **Scan & Count** (barcode) or **Manual Entry** (search by name/SKU).

### Step 4 — Scan counting (recommended)

1. **Select a location** at the bottom (e.g. Front Shelf). This is required.
2. Point the camera at the product barcode.
3. Choose counting mode:
   - **Increment mode ON** (default): each scan adds **+1** automatically. Best for shelf walks.
   - **Increment mode OFF**: after each scan, tap **0, 1, 5, or 10** for the quantity.
4. A green confirmation shows the last item counted (e.g. “Basmati Rice: 3”).
5. Continue scanning. Move to a new location by tapping a different location chip.

**If barcode is unknown:**

- Tap **Scan Again** to retry, or
- Tap **Record Unresolved** to log the barcode for follow-up, or
- Use **Manual Entry** instead.

**If multiple products match one barcode:**

- Pick the correct product from the list shown.

### Step 5 — Manual counting

Use when barcode is missing or damaged.

1. From the session, tap **Manual Entry**.
2. Select **Location**.
3. Search by product name or SKU.
4. Tap the product.
5. Enter **Counted Quantity** (or use quick buttons 0, 1, 5, 10).
6. For restricted items, select a **Reason Code** if there is a variance (breakage, theft suspected, damaged, etc.).
7. Tap **Save Count**.

### Step 6 — Submit for review

1. Return to the **Count Session** detail screen.
2. When counting is done, tap **Submit for Review**.
3. Status changes to **Review** — a manager must approve before the count is final.

---

## 6. Manager training: review and approval

Managers and owners see extra buttons on the **Dashboard** and in **Settings**.

### Variance review

1. Open **Dashboard → Review Variances** (or session detail when status is Review).
2. Use filters: All, Matched, Shortage, Overage, Restricted, Uncounted, Needs Approval.
3. For each line, check:
   - Product name and location
   - Expected vs counted
   - Variance amount and color
   - Whether approval is required
4. Tap **Approve Line** on individual items that look correct.
5. When all lines are reviewed, tap **Approve Session**.

### Restricted items review

1. Open **Dashboard → Restricted Items Review**.
2. Review all alcohol/tobacco lines with discrepancies.
3. Confirm reason codes and counts with staff if needed.
4. Approve lines before approving the full session.

### Audit history

1. Go to **Settings → Audit History** (manager/owner only).
2. View a log of logins, counts, edits, and approvals.
3. Entries marked **Offline** were recorded without network and synced later.

---

## 7. Products tab

Use **Products** to:

- Search by name, SKU, or barcode
- Filter by category (Rice & Grains, Alcohol, Tobacco, etc.)
- Tap a product to see details: expected qty, barcodes, restricted status, reorder level

This tab works **offline** using the cached catalog on your phone.

---

## 8. Offline mode and sync

ShopCount is **offline-first**:

- Counts save to your phone immediately, even without Wi‑Fi.
- When back online, data syncs to the server automatically.
- Dashboard shows **Pending sync** count when items are waiting.

### Settings → Sync & Offline

| Action | When to use |
|--------|-------------|
| **Test Connection** | Verify the app can reach the server |
| **Sync Now** | Force upload of pending counts |
| **Refresh Product Cache** | Re-download latest products/locations after catalog changes |

**Trainees should practice:**

1. Turn on airplane mode.
2. Count 2–3 items.
3. Turn off airplane mode.
4. Open Settings → **Sync Now**.
5. Confirm pending count goes to zero.

---

## 9. Hands-on training exercises

Use these demo barcodes in the training environment:

| Barcode | Product | Category |
|---------|---------|----------|
| `8901234567001` | Basmati Rice 10lb | Rice & Grains |
| `8901234567010` | Aashirvaad Atta 10kg | Flour & Atta |
| `8901234567020` | Toor Dal 4lb | Dals & Lentils |
| `8901234567060` | Kingfisher Premium 6pk | Alcohol (restricted) |
| `8901234567070` | Marlboro Red Pack | Tobacco (restricted) |

### Exercise A — Basic scan count (Staff, 15 min)

1. Log in as `staff@desimart.com`.
2. Create session: “Training Scan — [your name]”, type **Spot**.
3. Open session → **Scan & Count**.
4. Select **Front Shelf**.
5. Scan `8901234567001` three times (increment mode on).
6. Confirm last scan shows quantity **3**.
7. Submit for review.

### Exercise B — Manual entry with variance (Staff, 10 min)

1. Open session → **Manual Entry**.
2. Search “Toor Dal”, select location **Back Room**.
3. Enter counted qty **15** (expected is 20 — creates shortage).
4. Save and note red variance on session detail.

### Exercise C — Manager approval (Manager, 15 min)

1. Log in as `manager@desimart.com`.
2. Open the session from Exercise A/B (status **Review**).
3. Open **Review Variances** — approve lines.
4. Open **Restricted Items Review** if alcohol/tobacco was counted.
5. **Approve Session**.

### Exercise D — Offline sync (Staff, 10 min)

1. Enable airplane mode.
2. Count one product via manual entry.
3. Disable airplane mode.
4. Settings → **Sync Now** → verify success.

---

## 10. Troubleshooting

| Problem | What to try |
|---------|-------------|
| **Login failed / network error** | Check Wi‑Fi or cellular. Settings → Test Connection. Confirm API URL shows `https://productcount.up.railway.app/api/v1`. |
| **Unknown barcode** | Product may not be in catalog. Use Manual Entry or Record Unresolved. Refresh Product Cache in Settings. |
| **No locations on scan screen** | Sign out and sign in again, or Settings → Refresh Product Cache. |
| **Count failed after scan** | Select a location first. If error persists, use Manual Entry and report the message to a manager. |
| **Pending sync not clearing** | Settings → Sync Now. Check connection. Stay logged in. |
| **Cannot edit session** | Session may be Approved or Posted — only Draft/In Progress sessions accept new counts. |
| **Camera not working** | Allow camera permission in phone Settings → ShopCount. |

---

## 11. Quick reference card

### Staff daily checklist

- [ ] Sign in and confirm sync status is green
- [ ] Open or create count session
- [ ] Select **location** before every scan
- [ ] Count all items in assigned area
- [ ] Submit session for review when done

### Manager daily checklist

- [ ] Review sessions in **Review** status
- [ ] Check **Restricted Items** first
- [ ] Approve or follow up on large variances
- [ ] Approve completed sessions

### Reason codes (restricted items)

| Code | Use when |
|------|----------|
| Breakage | Item broken/spilled |
| Theft suspected | Missing with no explanation |
| Damaged | Unsellable damage |
| Expired | Past sell-by date |
| Receiving mismatch | Delivery count wrong |
| Unknown shrink | Unexplained loss |
| Open pack | Partial pack counted |
| Missing | Cannot locate item |
| Other | Anything else — add note |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **SKU** | Store product code (e.g. RICE-001) |
| **Barcode** | Scannable number on packaging |
| **Cycle count** | Counting part of the store on a schedule |
| **Spot count** | Quick count of specific items |
| **Full count** | Complete inventory count |
| **Variance** | Difference between expected and counted |
| **Sync** | Upload local counts to the server |
| **Audit trail** | Permanent log of who did what and when |

---

## 13. Support and documentation

| Resource | Location |
|----------|----------|
| API & technical docs | [docs/API.md](./API.md) |
| Architecture overview | [docs/ARCHITECTURE.md](./ARCHITECTURE.md) |
| Railway deployment | [docs/RAILWAY.md](./RAILWAY.md) |
| Developer setup | [README.md](../README.md) |

For training feedback or new scenario requests, contact your store manager or system administrator.

---

*ShopCount v1.0 — Inventory counting for Desi Mart*
