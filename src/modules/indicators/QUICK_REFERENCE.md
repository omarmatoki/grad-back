# Indicators Module - Quick Reference

## File Structure

```
src/modules/indicators/
├── schemas/
│   ├── indicator.schema.ts           - Main indicator model
│   └── indicator-history.schema.ts   - History tracking model
├── dto/
│   ├── create-indicator.dto.ts       - Create indicator DTO
│   ├── update-indicator.dto.ts       - Update indicator DTO
│   └── record-indicator-value.dto.ts - Record value DTO
├── indicators.service.ts              - Business logic & methods
├── indicators.controller.ts           - REST API endpoints
├── indicators.module.ts               - NestJS module
├── index.ts                          - Module exports
├── README.md                         - Complete documentation
└── QUICK_REFERENCE.md                - This file
```

## Key Features Implemented

### 1. Core Schema Fields (Matching Specification)
- `indicator_id` - Auto-generated ObjectId
- `project_id` - Reference to Projects
- `indicator_type` - Enum: input, output, outcome, impact, process, custom
- `name` - Indicator name
- `description` - Detailed description
- `measurement_method` - How it's measured
- `target_value` - Target to achieve
- `actual_value` - Current actual value
- `unit` - Measurement unit
- `calculation_formula` - For composite indicators
- `data_source` - Where data comes from
- `baseline_value` - Starting baseline
- `trend` - Auto-calculated trend (improving, stable, declining, no_data)
- `last_calculated_at` - Last calculation timestamp
- `created_at` / `updated_at` - Timestamps

### 2. History Schema Fields (Matching Specification)
- `history_id` - Auto-generated ObjectId
- `indicator_id` - Reference to Indicators
- `recorded_value` - The recorded value
- `calculated_at` - Measurement timestamp
- `source` - Data source
- `notes` - Additional notes
- Plus: status, change calculations, context, attachments

## Service Methods

### CRUD Operations
```typescript
create(dto)                    // Create new indicator
findAll(filters)              // Get all with filters
findOne(id)                   // Get by ID
update(id, dto)               // Update indicator
remove(id)                    // Delete (also deletes history)
```

### History & Value Recording
```typescript
recordValue(id, dto)          // Record new value + auto-update
getHistory(id, limit?, start?, end?)  // Get history entries
calculateTrend(id)            // Calculate trend from history
calculateFromFormula(id)      // Calculate from formula (placeholder)
```

### Query & Analytics
```typescript
findByProject(projectId)      // Get all for project
findByType(type, projectId?)  // Filter by type
findByTrend(trend, projectId?) // Filter by trend
findOffTrack(projectId?, threshold?) // Get underperforming
getStatistics(projectId?)     // Aggregated stats
count(projectId?)             // Count indicators
```

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/indicators` | Create indicator |
| GET | `/indicators` | Get all (with filters) |
| GET | `/indicators/:id` | Get by ID |
| PATCH | `/indicators/:id` | Update indicator |
| DELETE | `/indicators/:id` | Delete indicator |
| GET | `/indicators/statistics` | Get statistics |
| GET | `/indicators/project/:projectId` | Get by project |
| GET | `/indicators/type/:type` | Get by type |
| GET | `/indicators/trend/:trend` | Get by trend |
| GET | `/indicators/off-track` | Get underperforming |
| GET | `/indicators/count` | Count indicators |
| **POST** | `/indicators/:id/record-value` | **Record new value** |
| **GET** | `/indicators/:id/history` | **Get history** |
| POST | `/indicators/:id/calculate-trend` | Recalculate trend |
| POST | `/indicators/:id/calculate-from-formula` | Calculate from formula |

## How Recording Values Works

When you call `POST /indicators/:id/record-value`:

1. Creates a new history entry with the recorded value
2. Calculates change from previous value (amount & percentage)
3. Updates indicator's `actualValue` to the new value
4. Updates indicator's `lastCalculatedAt` timestamp
5. **Automatically recalculates and updates the trend**

```typescript
// Example
await recordValue(indicatorId, {
  recordedValue: 850,
  calculatedAt: new Date(),
  source: 'Field Survey',
  notes: 'Q1 measurement',
});

// This automatically:
// - Creates history entry
// - Sets indicator.actualValue = 850
// - Calculates trend from last 5 history entries
// - Updates indicator.trend
```

## Trend Calculation Algorithm

Analyzes the last 5 history entries:
- Calculates average percentage change
- If avg change >= +2%: `IMPROVING`
- If avg change <= -2%: `DECLINING`
- If -2% < avg change < +2%: `STABLE`
- If < 2 history entries: `NO_DATA`

## Database Indexes

### Indicator Indexes
- `{ project: 1 }` - Project lookups
- `{ indicatorType: 1 }` - Type filtering
- `{ project: 1, indicatorType: 1 }` - Combined
- `{ project: 1, trend: 1 }` - Trend filtering
- `{ lastCalculatedAt: -1 }` - Recent calculations
- `{ name: 'text', description: 'text' }` - Text search

### History Indexes
- `{ indicator: 1, calculatedAt: -1 }` - Main query
- `{ calculatedAt: -1 }` - Date range queries
- `{ status: 1 }` - Status filtering

## Import & Usage

```typescript
// Import module
import { IndicatorsModule } from '@modules/indicators';

@Module({
  imports: [IndicatorsModule],
})
export class AppModule {}

// Use service
import { IndicatorsService } from '@modules/indicators';

constructor(private indicatorsService: IndicatorsService) {}

// Use in code
const indicator = await this.indicatorsService.create({...});
await this.indicatorsService.recordValue(id, {...});
const history = await this.indicatorsService.getHistory(id);
```

## Authorization Levels

- **ADMIN, MANAGER**: Full access (create, update, delete, record values)
- **USER**: Read + record values
- **VIEWER**: Read-only

## Common Use Cases

### 1. Create and Track an Indicator
```typescript
// Create
const indicator = await indicatorsService.create({
  project: projectId,
  indicatorType: IndicatorType.OUTPUT,
  name: 'Beneficiaries Reached',
  targetValue: 1000,
  baselineValue: 0,
});

// Record monthly values
await indicatorsService.recordValue(indicator._id, {
  recordedValue: 250,
  calculatedAt: new Date('2024-01-31'),
});

await indicatorsService.recordValue(indicator._id, {
  recordedValue: 520,
  calculatedAt: new Date('2024-02-28'),
});

// Trend is automatically calculated!
```

### 2. Monitor Project Performance
```typescript
// Get all indicators for a project
const indicators = await indicatorsService.findByProject(projectId);

// Find underperforming indicators
const offTrack = await indicatorsService.findOffTrack(projectId, 0.7);

// Get improving indicators
const improving = await indicatorsService.findByTrend(
  TrendDirection.IMPROVING,
  projectId
);
```

### 3. View History & Trends
```typescript
// Get last 6 months of history
const history = await indicatorsService.getHistory(
  indicatorId,
  undefined,
  new Date('2024-01-01'),
  new Date('2024-06-30')
);

// Analyze trends
history.forEach(entry => {
  console.log(entry.recordedValue, entry.changePercentage);
});
```

## Next Steps for Formula Implementation

The `calculateFromFormula` method is a placeholder. To implement:

```typescript
import { evaluate } from 'mathjs';

async calculateFromFormula(indicatorId: string): Promise<number> {
  const indicator = await this.findOne(indicatorId);

  // Get data for variables in formula
  const context = {
    // Define your variables here
  };

  // Evaluate formula
  const result = evaluate(indicator.calculationFormula, context);

  // Record the calculated value
  await this.recordValue(indicatorId, {
    recordedValue: result,
    calculatedAt: new Date(),
    source: 'Calculated from formula',
  });

  return result;
}
```

## Testing Checklist

- [ ] Create indicator
- [ ] Update indicator
- [ ] Record first value (check history created)
- [ ] Record second value (check change calculated)
- [ ] Record 5+ values (check trend calculated)
- [ ] Get history with date filters
- [ ] Delete indicator (check history also deleted)
- [ ] Test all query endpoints
- [ ] Test authorization guards
- [ ] Test validation (invalid data)

## Performance Notes

- History entries are immutable (no updates)
- Indexes optimized for common queries
- Trend calculation uses only last 5 entries (efficient)
- Achievement rate is computed property (not stored)
- Deleting indicator cascades to history
