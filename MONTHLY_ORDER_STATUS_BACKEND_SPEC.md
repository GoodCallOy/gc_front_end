# Backend Spec: Monthly Order Status

Assign Goals sets **order status per calendar month** (not only once per order). The front end stores overrides on the order document, keyed by `YYYY-MM`, mirroring `monthlyRevenueGoals`.

---

## 1. Order document field

Add an optional map on the **Order** model:

| Field | Type | Description |
|-------|------|-------------|
| `monthlyOrderStatus` | `Object` (map) | Keys: `"YYYY-MM"`. Values: `"pending"` \| `"in-progress"` \| `"completed"` \| `"cancelled"` \| `"on-hold"`. |

**Example:**

```json
{
  "_id": "...",
  "caseName": "Mintly Juniper Q2-2025",
  "orderStatus": "in-progress",
  "monthlyOrderStatus": {
    "2026-06": "in-progress",
    "2026-07": "on-hold"
  }
}
```

- `orderStatus` remains the **legacy default** when a month key is missing.
- When the UI updates status for July 2026, it sends the full merged map (see below).

---

## 2. API: update order

**Existing endpoint:** `PUT /orders/:id`

**Additional / updated body field:**

```json
{
  "monthlyOrderStatus": {
    "2026-06": "in-progress",
    "2026-07": "on-hold"
  }
}
```

**Backend requirements:**

1. Persist `monthlyOrderStatus` on the order document (merge/replace map as sent).
2. Validate each value is one of: `pending`, `in-progress`, `completed`, `cancelled`, `on-hold`.
3. Validate each key matches `YYYY-MM`.
4. Return the updated order including `monthlyOrderStatus` on `GET /orders` and `GET /orders/:id`.

**Optional (backward compatibility):** Do **not** require changing `orderStatus` when only `monthlyOrderStatus` is sent. The front end may stop writing global `orderStatus` from Assign Goals once this field exists.

---

## 3. Read behaviour (front end)

For dashboard month **M** (`currentDateRange` → `YYYY-MM`):

```text
effectiveStatus(order, M) =
  order.monthlyOrderStatus[M] ?? order.orderStatus ?? "pending"
```

Used for:

- Assign Goals status radio buttons (per viewed month)
- On-hold → exclude from **current revenue** for that month
- Estimated revenue → include only when effective status is `in-progress` for that month

---

## 4. Copy order to next month

When copying an order to the next month, the front end sets:

```text
monthlyOrderStatus[nextMonthKey] = monthlyOrderStatus[sourceMonthKey] ?? orderStatus ?? "pending"
```

Backend should persist the map sent on `POST /orders/` create payloads as well.

---

## 5. Migration

Existing orders without `monthlyOrderStatus` continue to use `orderStatus` for every month until a month is edited in Assign Goals.

No migration required; optional script can backfill `{ [startMonth]: orderStatus }` for active multi-month orders.
