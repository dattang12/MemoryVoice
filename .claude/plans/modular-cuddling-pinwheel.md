# Strategy / Rally Trajectory Analysis Upgrade Plan

## Overview
Upgrade the Strategy mode to provide situation-aware recommendations with TOP-3 shot/path options per decision point, including rally state detection (attack/neutral/defense), pressure scoring, and detailed rationales.

---

## Architecture

### New Module Structure
```
src/lib/strategy_engine/
├── index.ts                    # Public exports
├── types.ts                    # New type definitions
├── constants.ts                # Court zones (9-grid), thresholds, scoring weights
├── shot-segmentation.ts        # Detect decision points from trajectory
├── rally-state-machine.ts      # Compute phase/initiative/pressure per shot
├── feature-extraction.ts       # Extract per-shot features
├── recommendation-generator.ts # Generate TOP-3 recommendations with rationale
├── scoring-engine.ts           # Score recommendations by movement pressure, etc.
└── __tests__/                  # Unit tests
```

---

## Key Type Definitions

```typescript
// Rally State Model
interface RallyState {
  phase: 'attack' | 'neutral' | 'defense';
  initiative: 'us' | 'them' | 'unknown';
  pressure: number; // 0..1
  openCourtZones: number[]; // Zone IDs 0-8 (3x3 grid)
}

// Shot Features
interface ShotFeatures {
  contactZone: number;           // 0-8
  landingZone: number;           // 0-8
  shuttleSpeedProxy: number;
  shuttleHeightProxy: number;
  opponentMovementDistance: number;
  opponentDirectionChange: number;
  recoveryQuality: number;
  rallyState: RallyState;
}

// Recommendation with Rationale
interface ShotRecommendation {
  id: string;
  shotType: ShotType;
  targetZone: number;
  pathPolyline: PathPoint[];
  score: number; // 0-100
  rationale: RecommendationRationale[];
  confidence: number;
}

interface RecommendationRationale {
  type: 'movement_pressure' | 'open_court' | 'risk_reduction' | 'angle_denial';
  description: string;
  impact: number; // -1 to 1
}
```

---

## Implementation Steps

### Phase 1: Core Engine
**Files to create:**
- `src/lib/strategy_engine/types.ts` - All new type definitions
- `src/lib/strategy_engine/constants.ts` - Court zones (9-grid), scoring weights
- `src/lib/strategy_engine/shot-segmentation.ts` - Detect shots via direction-change + speed peaks
- `src/lib/strategy_engine/rally-state-machine.ts` - Compute phase/pressure/initiative

**Algorithm: Shot Segmentation**
- Detect direction change > 45 degrees between velocity vectors
- Detect speed peaks (local maximum > 1.3x next)
- Detect net crossings (y crosses 0.5)
- Classify shot type by trajectory shape (clear/drop/smash/drive/net/lift)

**Algorithm: Rally State**
- Phase: Based on recent shot types (smash/drop = attack, lift/clear = defense)
- Pressure: Time pressure + position pressure + recent smash received
- Open zones: All zones not adjacent to opponent position

### Phase 2: Recommendations
**Files to create:**
- `src/lib/strategy_engine/feature-extraction.ts` - Extract contactZone, landingZone, etc.
- `src/lib/strategy_engine/scoring-engine.ts` - Score by movement pressure, open court
- `src/lib/strategy_engine/recommendation-generator.ts` - Generate TOP-3 per shot

**Scoring Formula:**
```
score = 50 (base)
  + movementPressure * 20    // How far opponent must move
  + openCourtExploitation * 25  // Targets undefended area
  - riskUnderPressure * 15   // Penalty for risky shots when pressured
  - angleExposure * 10       // Penalty for exposing weak angles
```

### Phase 3: UI Updates
**Files to modify:**
- `src/app/strategy/page.tsx` - Main strategy page

**New UI Components:**
1. **RallyStateChip** - Shows "Defense (pressure 78%) → Reset"
2. **RecommendationCard** - Expandable card with rationale list
3. **Multi-path rendering** - 3 recommendation paths with distinct styles:
   - Rec 1: Green solid (selected)
   - Rec 2: Blue dashed
   - Rec 3: Orange dotted
4. **ShotTimeline** - Clickable markers to navigate between shots

**Canvas/3D Updates:**
- Draw all 3 recommendation paths simultaneously
- Highlight selected recommendation with thicker line
- Keep original trajectory (red) always visible

### Phase 4: Database Schema
**New migration file:** `supabase/migration-v4-strategy.sql`

```sql
-- Rallies table
CREATE TABLE rallies (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    rally_index INTEGER,
    total_shots INTEGER,
    dominant_phase TEXT,
    average_pressure NUMERIC
);

-- Shots table
CREATE TABLE shots (
    id UUID PRIMARY KEY,
    rally_id UUID REFERENCES rallies(id),
    shot_index INTEGER,
    shot_type TEXT,
    features JSONB,
    rally_state JSONB,
    trajectory_slice JSONB
);

-- Recommendations table
CREATE TABLE recommendations (
    id UUID PRIMARY KEY,
    shot_id UUID REFERENCES shots(id),
    rec_index INTEGER CHECK (0-2),
    shot_type TEXT,
    target_zone INTEGER,
    score NUMERIC,
    path_polyline JSONB,
    rationale JSONB
);
```

### Phase 5: Integration
**Update `generateStrategyAnalysis()` in page.tsx:**
1. Import new strategy engine functions
2. Run shot segmentation on trajectory
3. Compute rally state for each shot
4. Generate TOP-3 recommendations per shot
5. Save to new database tables
6. Return enhanced result format

**Backward Compatibility:**
- Check for legacy results without `rally_analysis` field
- Fall back to existing 3 static recommendations if needed

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/strategy/page.tsx` | Integrate new engine, add state chip, multi-path rendering, shot timeline |
| `src/lib/types.ts` | Export new types from strategy_engine |
| `src/lib/courtSpec.ts` | Add 9-zone grid helpers: `positionToZone()`, `zoneToPosition()` |
| `src/components/CourtTrajectory3D.tsx` | Add multi-path rendering support |

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/strategy_engine/types.ts` | Type definitions |
| `src/lib/strategy_engine/constants.ts` | Zone grid, thresholds |
| `src/lib/strategy_engine/shot-segmentation.ts` | Shot detection |
| `src/lib/strategy_engine/rally-state-machine.ts` | State computation |
| `src/lib/strategy_engine/feature-extraction.ts` | Feature extraction |
| `src/lib/strategy_engine/scoring-engine.ts` | Recommendation scoring |
| `src/lib/strategy_engine/recommendation-generator.ts` | TOP-3 generation |
| `src/lib/strategy_engine/index.ts` | Public exports |
| `src/lib/strategy_engine/__tests__/*.test.ts` | Unit tests |
| `supabase/migration-v4-strategy.sql` | Database schema |

---

## Testing Strategy

### Unit Tests
1. **Shot Segmentation**: Verify N shots detected, correct types classified
2. **Rally State Machine**: Verify attack/neutral/defense phases, pressure calculation
3. **Recommendation Generator**: Verify exactly 3 recommendations, sorted by score desc

### Test Data
- Use mock trajectory arrays with known patterns
- Test graceful degradation when pose data is missing

### Debug Logging
- Add `NEXT_PUBLIC_STRATEGY_DEBUG=true` env flag
- Wrap logs in `if (DEBUG_FLAG)` checks

---

## Verification

1. **Manual Testing:**
   - Upload a video or select from history
   - Verify rally state chip shows correct phase and pressure
   - Verify 3 recommendation paths render simultaneously
   - Click each recommendation to see rationale expand
   - Toggle 2D/3D views - paths should persist
   - Check playback controls still work

2. **Database Verification:**
   - Query `rallies`, `shots`, `recommendations` tables
   - Verify data persists correctly

3. **Run Tests:**
   ```bash
   npm test -- --testPathPattern=strategy_engine
   ```

---

## Constraints Preserved

- Existing 2D/3D toggle functionality unchanged
- Graceful degradation when trajectory/pose data missing
- Memoized arrays to prevent re-render loops
- All new code isolated in `strategy_engine/` directory
