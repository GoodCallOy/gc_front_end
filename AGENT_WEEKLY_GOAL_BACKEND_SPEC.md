# Backend Spec: Agent Weekly Goals

This document describes what the front end expects from the backend for the **Agent Weekly Goal** feature. Agents (callers) can add weekly goals for each case they are assigned to.

---

## 1. API Endpoint

**Create / save a weekly goal**

- **Method:** `POST`
- **URL:** `{baseUrl}/agentGoals/`
- **Example:** `POST /api/v1/agentGoals/`

**Request body (JSON):**

| Field        | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `agent`     | string | Yes      | Display name of the agent (gcAgent name). |
| `agentId`   | string | Yes      | ID of the agent (gcAgent `_id`). |
| `case`      | string | Yes      | Case/order name (order `caseName`). |
| `orderId`   | string | Yes      | ID of the order/case (order `_id`). |
| `goal`      | number | Yes      | Weekly goal value (e.g. number of units). Must be ≥ 0. |
| `type`      | string | Yes      | Always `"Weekly"` for this flow. |
| `goal_date` | object | Yes      | Week range. |
| `goal_date.start` | string | Yes | Start of week (Monday) in `YYYY-MM-DD`. |
| `goal_date.end`   | string | Yes | End of week (Sunday) in `YYYY-MM-DD`. |
| `monthKey`  | string | Yes      | Month of the week in `YYYY-MM` (e.g. `"2025-01"`). |

**Example request body:**

```json
{
  "agent": "Jane Smith",
  "agentId": "507f1f77bcf86cd799439011",
  "case": "Customer Campaign Q1",
  "orderId": "507f1f77bcf86cd799439012",
  "goal": 25,
  "type": "Weekly",
  "goal_date": {
    "start": "2025-01-06",
    "end": "2025-01-12"
  },
  "monthKey": "2025-01"
}
```

---

## 2. Suggested Database Model

Store one document/row per **agent + order + week** so you can support multiple weeks per case and upsert by week.

**Suggested schema (e.g. MongoDB):**

```javascript
{
  _id: ObjectId,
  agentId: String,      // gcAgent _id
  orderId: String,      // order _id
  agentName: String,    // denormalized for display
  caseName: String,     // order caseName, denormalized
  type: String,         // "Weekly"
  weekStartDate: Date,  // Monday of the week (or store goal_date.start)
  weekEndDate: Date,    // Sunday (or goal_date.end)
  goal: Number,         // weekly goal value
  monthKey: String,     // "YYYY-MM"
  createdAt: Date,
  updatedAt: Date
}
```

**Suggested unique constraint / index:**  
`(agentId, orderId, weekStartDate)` or `(agentId, orderId, goal_date.start)`  
so the same agent cannot have two different weekly goals for the same case and same week (upsert on conflict).

**Relational (SQL) example:**

```sql
CREATE TABLE agent_weekly_goals (
  id            SERIAL PRIMARY KEY,
  agent_id      VARCHAR(255) NOT NULL,
  order_id      VARCHAR(255) NOT NULL,
  agent_name    VARCHAR(255),
  case_name     VARCHAR(255),
  type          VARCHAR(50) DEFAULT 'Weekly',
  week_start    DATE NOT NULL,
  week_end      DATE NOT NULL,
  goal          NUMERIC NOT NULL CHECK (goal >= 0),
  month_key     VARCHAR(7) NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE (agent_id, order_id, week_start)
);
```

---

## 3. Backend Behavior

1. **Validate**
   - Required: `agentId`, `orderId`, `goal`, `type`, `goal_date.start`, `goal_date.end`, `monthKey`.
   - `goal` ≥ 0.
   - `type` is `"Weekly"` for this flow.

2. **Optional checks**
   - Agent exists (e.g. in gcAgents).
   - Order exists and agent is in that order’s `assignedCallers` (if you want to enforce “only assigned cases”).

3. **Upsert**
   - Same agent + same order + same week (e.g. same `goal_date.start`): **update** existing row/document.
   - Otherwise: **insert** new row/document.

4. **Response**
   - **Success:** `201 Created` (or `200 OK` for upsert) and the saved document/record in the response body (optional but useful).
   - **Validation/error:** `4xx` with a JSON body that can include a `message` (e.g. `{ "message": "Goal must be 0 or greater" }`). The front end shows `err.response?.data?.message` or a generic “Failed to save” message.

---

## 4. Optional: GET endpoint for listing weekly goals

If the front end will later show “my weekly goals” or pre-fill existing goals:

- **Method:** `GET`
- **URL examples:**
  - `GET /api/v1/agentGoals?agentId=xxx&orderId=yyy`  
  - or `GET /api/v1/agentGoals?agentId=xxx&monthKey=2025-01`

**Response:** Array of objects with at least: `agentId`, `orderId`, `weekStartDate` (or `goal_date.start`), `weekEndDate` (or `goal_date.end`), `goal`, `monthKey`, plus any other fields you store.

---

## 5. Summary for backend dev

- **Endpoint:** `POST /api/v1/agentGoals/` (or your existing `agentGoals` create route).
- **Body:** JSON with `agent`, `agentId`, `case`, `orderId`, `goal`, `type: "Weekly"`, `goal_date: { start, end }`, `monthKey`.
- **Storage:** One record per agent + order + week; unique on (agentId, orderId, week); upsert when same week is submitted again.
- **Response:** 201/200 on success; 4xx with optional `message` on error.
