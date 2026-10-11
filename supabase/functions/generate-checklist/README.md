# generate-checklist

Proposal feature 2: Auto-generated Gear Checklist.

**Input** (`body`): `{ routeId, weather }`. Look up the route and the caller's
profile server-side.

**Output**: `{ items: [{ label, quantity, reason, category, sort_order }] }`.
This is the same shape as `generateChecklistItems()` in `src/services/checklist.service.js`.
`category` must be one of `clothing`, `safety`, `navigation`, `water_food`,
`shelter`, `documents`, `other`.

The store still writes the items to `checklist_items`, so the function only
generates them.
