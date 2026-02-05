# LayoutEditorDnd.tsx Refactoring Guide
## Converting from layout.positions Array to layout.assets Nested Object

---

## Overview of Data Structure Changes

### Current Structure
```
layout: {
  positions: [
    { row: 0, col: 0, objectNumber: "board-1", width: 2, height: 1 },
    { row: 2, col: 3, objectNumber: "projector-1", width: 2, height: 1 }
  ],
  objects: [
    { objectNumber: "board-1", type: "board", status: "working" },
    { objectNumber: "projector-1", type: "projector", status: "working" }
  ]
}
```

### New Structure
```
layout: {
  assets: {
    board: [
      { number: 1, row: 0, col: 0, status: "working" }
    ],
    projector: [
      { number: 1, row: 2, col: 3, status: "working" }
    ],
    ac: [],
    fan: [],
    table: [],
    chair: [],
    door: []
  }
}
```

---

## Key Refactoring Areas

### 1. getNextAssetNumber(type)

**Current Implementation:**
- Iterates through `layout.positions` array
- Filters for matching `objectNumber` strings
- Extracts number part using string parsing

**New Implementation Logic:**
- Access `layout.assets[type]` directly (a typed array)
- Extract `.number` field from each asset object
- Calculate max number from the array
- Return `maxNumber + 1`

**Why it's better:**
- Direct access without filtering the entire positions array
- Type-safe: accessing the correct asset type directly
- Simpler logic: no string parsing needed
- Array is already filtered by type

**Implementation pattern:**
```
For type "board":
1. Get layout.assets.board array
2. Map each asset to asset.number
3. Find max of these numbers
4. Return max + 1 (or 1 if empty array)
```

---

### 2. handleDragStartAsset - Moving Existing Assets

**Current Data:**
- Receives `LayoutPosition` object with `objectNumber` string
- Must lookup object in `objects` array to get type info

**New Data:**
- Need to track both the type AND the asset object itself
- Asset object has: `{ number, row, col, status }`

**What changes:**
- State variable `draggedAsset` should store more information
  - Option A: Store the asset type along with the asset data
  - Option B: Parse type from asset being dragged
- When checking for overlaps, use `getAssetSize()` with the known type

**Implementation pattern:**
```
// When user drags an asset from the grid:
// 1. You know which cell was clicked
// 2. Find the asset in layout.assets[type] by matching (row, col)
// 3. Store both the type and the asset object
// 4. Use the known type to get dimensions

// Need a new state:
draggedAssetInfo: { type: "board", asset: { number: 1, row: 0, col: 0, status: "working" } } | null
```

---

### 3. handleDropOnGrid - Managing Asset Placement

**Current Flow - Moving Assets:**
- Finds old position by `objectNumber`
- Updates in `layout.positions` array

**New Flow - Moving Assets:**
- Receive the type and asset object from drag state
- Update the specific asset in `layout.assets[type]` array
- Perform the position update directly on that array

**Current Flow - Adding New Assets:**
- Stores temporary "objectNumber" (just a number) in modal form
- On save, creates full "objectNumber" string format

**New Flow - Adding New Assets:**
- Modal shows asset type selector
- Generate next number for that type
- User confirms placement
- Add to `layout.assets[type]` array

**Implementation pattern for moving:**
```
When dropping an existing asset:
1. Check if draggedAssetInfo exists
2. Validate no overlaps in new position
3. Update layout.assets[draggedAssetInfo.type] by finding the asset
4. Modify the row/col on that asset object
5. Don't touch positions array
```

**Implementation pattern for adding:**
```
When dropping a new asset type:
1. Show modal with pre-filled type
2. Calculate next number via getNextAssetNumber(type)
3. On save, add new object to layout.assets[type]
4. Clear draggedType state
```

---

### 4. handleModalSave - Creating/Updating Assets

**Current Logic:**
```
- Check if objectNumber already exists in objects array
- POST to create new object if not exists, OR PATCH if exists
- Update layout.positions array with new position
- Re-fetch objects array
```

**Problems with current approach:**
- Maintains two sources of truth (objects array and positions array)
- Objects array is fetched separately, not integrated with layout
- Complex to determine if asset is new or existing

**New Logic:**
```
- Determine if this is:
  a) A new asset (not in layout.assets[type])
  b) An edit to existing asset (already in layout.assets[type])
- For new asset:
  - POST to /buildings/{bldg}/floors/{floor}/rooms/{room}/objects/{type}/{number}
  - Add object to layout.assets[type] array
- For edit:
  - PATCH to /buildings/{bldg}/floors/{floor}/rooms/{room}/objects/{type}/{number}
  - Update existing object in layout.assets[type] array
- Don't re-fetch objects; just update the layout state
```

**Why this is better:**
- Single source of truth: layout.assets contains all asset data
- No need for separate objects state
- Clear differentiation between new and edit flows
- Assets always stay in sync with positions

**Key data flow:**
```
Modal Form Data (NEW STRUCTURE):
{
  type: "board",              // Selected from dropdown
  number: 1,                  // Generated or parsed from existing
  status: "working",
  row: 0,                     // From selectedCell
  col: 0
}

On Save:
1. Determine if updating: check if asset exists in layout.assets[type]
   - If exists with same number: it's an edit
   - If doesn't exist: it's new
2. Make appropriate API call with /objects/{type}/{number} format
3. On success, update layout.assets[type]:
   - For new: push new asset object
   - For edit: find and update the matching asset
```

---

### 5. handleModalDelete - Removing Assets

**Current Logic:**
- Find position by cell coordinates in `layout.positions`
- Delete via API using full `objectNumber`
- Remove from `layout.positions` array

**New Logic:**
- Need to know which type and number to delete
- This information comes from `selectedCell` + finding asset at that position
- Delete via API using `/objects/{type}/{number}` format
- Remove from `layout.assets[type]` array

**Implementation pattern:**
```
When user clicks delete:
1. Look at selectedCell coordinates (row, col)
2. Find which type contains an asset at that position
   - Iterate: for (const type of ASSET_TYPES)
     - Find asset in layout.assets[type] where asset.row === selectedCell.row && asset.col === selectedCell.col
3. Once found, you have the type and the asset object with its number
4. Confirm deletion
5. DELETE to /buildings/{bldg}/floors/{floor}/rooms/{room}/objects/{type}/{number}
6. Remove from layout.assets[type] array
7. Close modal
```

---

### 6. Rendering - Displaying All Assets

**Current Approach:**
- Iterate `layout.positions` array
- For each position, lookup object in `objects` array
- Render as grid cells

**Problem:**
- Two separate iterations needed (empty cells vs assets)
- Dependency on external objects array

**New Approach:**
- Flatten all assets from layout.assets into a single array for rendering
- Iterate this flattened array to render grid cells
- Keep empty cell rendering logic the same

**Helper function needed:**
```
// Get all assets as flat array with type information
getAllAssetsFlat(): Array<{
  type: "board" | "projector" | ... ,
  number: number,
  row: number,
  col: number,
  status: "working" | "faulty" | "pending"
}> {
  const allAssets = [];
  for (const type of ASSET_TYPES) {
    const typeAssets = layout.assets[type] || [];
    for (const asset of typeAssets) {
      allAssets.push({
        type,
        number: asset.number,
        row: asset.row,
        col: asset.col,
        status: asset.status
      });
    }
  }
  return allAssets;
}
```

**Why this pattern:**
- Single pass through all assets for rendering
- Each asset carries its type information
- Easy to generate "objectNumber" string when needed: `${type}-${number}`
- Cleaner rendering logic

**In rendering sections:**
```
// Old:
layout.positions.map((position) => {
  const asset = objects.find(obj => obj.objectNumber === position.objectNumber);
  // ...
})

// New:
getAllAssetsFlat().map((asset) => {
  const width = getAssetSize(asset.type).width;
  const height = getAssetSize(asset.type).height;
  // asset has type, number, row, col, status directly
})
```

**Overlap detection for empty cells:**
```
// Check if a grid cell is occupied by any asset
function isCellOccupied(row: number, col: number): boolean {
  for (const asset of getAllAssetsFlat()) {
    const { width, height } = getAssetSize(asset.type);
    if (col >= asset.col && col < asset.col + width &&
        row >= asset.row && row < asset.row + height) {
      return true;
    }
  }
  return false;
}
```

---

### 7. Modal Form Data Structure

**Current Structure:**
```
modalFormData: {
  objectNumber: "board-1",  // Full string with type-number format
  type: "board",
  status: "working"
}
```

**Problems:**
- `objectNumber` includes type info, but type is separate field
- Modal logic parses/constructs this string
- Redundant information

**New Structure:**
```
modalFormData: {
  type: "board",              // Asset type
  number: 1,                  // Numeric part only
  status: "working",
  row?: number,               // Current position (from selectedCell)
  col?: number
}
```

**Benefits:**
- Separates concerns: type and number are distinct
- No string parsing needed
- Clear data flow
- Type is controlled by dropdown, number is controlled by input

**Modal Input Changes:**
```
// Current:
<input
  type="number"
  value={modalFormData.objectNumber.split("-")[1] || ""}
  onChange={(e) => {
    const num = e.target.value;
    setModalFormData({
      ...modalFormData,
      objectNumber: num ? `${modalFormData.type}-${num}` : modalFormData.type + "-"
    });
  }}
/>

// New:
<input
  type="number"
  value={modalFormData.number}
  onChange={(e) => {
    setModalFormData({
      ...modalFormData,
      number: parseInt(e.target.value) || 0
    });
  }}
/>

// Construct full name for display: {modalFormData.type}-{modalFormData.number}
```

**Type change handler:**
```
// Current:
onChange={(e) => {
  const newType = e.target.value;
  setModalFormData({
    ...modalFormData,
    type: newType,
    objectNumber: getNextAssetNumber(newType)  // Returns number
  });
}}

// New:
onChange={(e) => {
  const newType = e.target.value;
  setModalFormData({
    ...modalFormData,
    type: newType,
    number: getNextAssetNumber(newType)  // Now correctly just a number
  });
}}
```

---

### 8. Determining Edit vs Create in Modal

**Current:**
```
layout.positions.find((p) => p.row === selectedCell.row && p.col === selectedCell.col)
  ? "Edit Asset"
  : "Add Asset"
```

**Problem:**
- Searches positions array each time

**New:**
```
function getAssetAtCell(row: number, col: number): { type: ObjectType["type"], asset: AssetObject } | null {
  for (const type of ASSET_TYPES) {
    const asset = layout.assets[type]?.find(a => a.row === row && a.col === col);
    if (asset) return { type, asset };
  }
  return null;
}

// In modal logic:
const existingAsset = getAssetAtCell(selectedCell.row, selectedCell.col);
title: existingAsset ? "Edit Asset" : "Add Asset"
```

---

### 9. API Endpoint Changes

**Current Endpoints:**
```
// Create
POST /buildings/{bldg}/floors/{floor}/rooms/{room}/objects
Body: { objectNumber: "board-1", type: "board", status: "working" }

// Update
PATCH /buildings/{bldg}/floors/{floor}/rooms/{room}/objects/{objectNumber}
Body: { type: "board", status: "working" }

// Delete
DELETE /buildings/{bldg}/floors/{floor}/rooms/{room}/objects/{objectNumber}
```

**New Endpoints:**
```
// Create (with position in body or separate)
POST /buildings/{bldg}/floors/{floor}/rooms/{room}/objects/{type}/{number}
Body: { row: 0, col: 0, status: "working" }

// Update
PATCH /buildings/{bldg}/floors/{floor}/rooms/{room}/objects/{type}/{number}
Body: { row: 0, col: 0, status: "working" }

// Delete
DELETE /buildings/{bldg}/floors/{floor}/rooms/{room}/objects/{type}/{number}
```

**URL Construction Pattern:**
```
// When you have type and number:
const objectPath = `objects/${modalFormData.type}/${modalFormData.number}`;

// Full URL example:
POST /buildings/1/floors/2/rooms/3/objects/board/1
PATCH /buildings/1/floors/2/rooms/3/objects/board/1
DELETE /buildings/1/floors/2/rooms/3/objects/board/1
```

---

### 10. State Management Cleanup

**Remove:**
- `objects` state (no longer needed; data is in layout.assets)
- Keep positions array in types for backwards compatibility, but don't use it in component

**Keep:**
- `layout` state (now contains full asset data)
- `currentLayout` state (for comparisons/resets)
- Other UI states (modal, selectedCell, etc.)

**Update:**
- `draggedAsset` should include type information
- `modalFormData` should use number instead of objectNumber string

---

## Migration Checklist

### Phase 1: Update State & Types
- [ ] Verify `Layout` interface has `assets` property (already done in types)
- [ ] Update component to not use `objects` state
- [ ] Update component to not fetch objects array

### Phase 2: Update Data Access
- [ ] Replace all `layout.positions` access with appropriate `layout.assets` access
- [ ] Create `getAllAssetsFlat()` helper function
- [ ] Create `getAssetAtCell()` helper function
- [ ] Update `getNextAssetNumber()` to use `layout.assets[type]`

### Phase 3: Update Drag & Drop
- [ ] Update `draggedAsset` to include type information (or update state structure)
- [ ] Update `handleDragStartAsset()` to capture type
- [ ] Update `handleDropOnGrid()` for asset movement to use `layout.assets[type]`
- [ ] Update `handleDropOnGrid()` for new asset placement

### Phase 4: Update Modal
- [ ] Change `modalFormData.objectNumber` to `modalFormData.number`
- [ ] Update modal input to handle number field
- [ ] Update modal title logic to use `getAssetAtCell()`
- [ ] Update type selector to update `number` via `getNextAssetNumber()`

### Phase 5: Update CRUD Operations
- [ ] Update `handleModalSave()` to determine edit vs create correctly
- [ ] Update `handleModalSave()` API calls to use new endpoints with type/number
- [ ] Update `handleModalSave()` to update `layout.assets[type]` instead of positions
- [ ] Update `handleModalDelete()` to find asset and call correct endpoint
- [ ] Update `handleModalDelete()` to remove from `layout.assets[type]`

### Phase 6: Update Rendering
- [ ] Update grid rendering to use `getAllAssetsFlat()`
- [ ] Update asset list rendering to use `getAllAssetsFlat()`
- [ ] Update empty cell detection to use flattened asset list
- [ ] Update overlap detection logic

### Phase 7: Testing
- [ ] Test creating new assets by dragging types
- [ ] Test moving assets to different positions
- [ ] Test editing asset properties (type, status)
- [ ] Test deleting assets
- [ ] Test saving layout to backend
- [ ] Verify no layout.positions array is used

---

## Important Considerations

### Backwards Compatibility
- The types keep `positions` array optional for backwards compatibility
- In the new component, ignore positions array entirely
- When saving layout to backend, only save `assets` object

### Asset Position Uniqueness
- Ensure no two assets occupy the same cell
- Check overlaps before confirming placement
- Overlap detection should scan all type arrays

### Modal State Management
- Modal data should represent what's being edited
- When opening for existing asset: populate from that asset's data
- When opening for new placement: pre-fill type and generate next number
- When changing type: regenerate number for new type

### Grid Cell Rendering Performance
- Current approach: iterate positions to check occupancy (O(positions))
- New approach: iterate all assets when checking occupancy (O(assets))
- If large number of assets, consider caching occupancy map per render

### Type Safety
- Use ASSET_TYPES constant throughout for iteration
- Ensure all operations on layout.assets access valid type keys
- Type assertion might be needed when accessing layout.assets[type] if it could be undefined

---

## Example: Converting a Complete Flow

### Current: Add a new board asset to position (0,0)

```
1. User drags "board" type to grid cell (0,0)
2. handleDropOnGrid() triggered with draggedType="board"
3. Modal shows, defaulting type="board", objectNumber=1
4. User confirms in modal
5. handleModalSave():
   - POST /objects with objectNumber="board-1", type="board", status="working"
   - Fetches objects array
   - Updates layout.positions with new entry
   - Updates objects state
```

### New: Add a new board asset to position (0,0)

```
1. User drags "board" type to grid cell (0,0)
2. handleDropOnGrid() triggered with draggedType="board"
3. Modal shows with:
   - type="board" (pre-filled)
   - number=getNextAssetNumber("board") = 1 (pre-filled)
   - status="working"
4. User confirms in modal
5. handleModalSave():
   - POST /objects/board/1 with row=0, col=0, status="working"
   - On success, add to layout.assets.board: { number: 1, row: 0, col: 0, status: "working" }
   - Update layout state
   - Close modal
   - No need to re-fetch (data already in layout)
```

---

## Edge Cases to Handle

1. **Asset Type Not in Layout**: Always ensure `layout.assets[type]` exists before accessing
2. **Changing Asset Type While Editing**: When type selector changes, number should reset to next available for new type
3. **Position Conflicts**: Before confirming placement, verify no overlaps
4. **Grid Boundary**: Before confirming placement, verify asset fits within grid
5. **Deleted Asset References**: After deleting, ensure modal closes and state clears

