# Indicators Module

Complete module for managing project indicators with comprehensive history tracking.

## Database Schema

### Indicators Table
- `indicator_id` (ObjectId) - Primary key
- `project_id` (ObjectId) - Reference to Projects
- `indicator_type` - Type of indicator (input, output, outcome, impact, process, custom)
- `name` - Indicator name
- `description` - Detailed description
- `measurement_method` - How the indicator is measured
- `target_value` - Target value to achieve
- `actual_value` - Current actual value
- `unit` - Measurement unit (number, percentage, currency, etc.)
- `calculation_formula` - Formula for composite indicators
- `data_source` - Source of data
- `baseline_value` - Starting baseline value
- `trend` - Trend direction (improving, stable, declining, no_data)
- `last_calculated_at` - Last calculation timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Indicator History Table
- `history_id` (ObjectId) - Primary key
- `indicator_id` (ObjectId) - Reference to Indicators
- `recorded_value` - The recorded value
- `calculated_at` - When this value was measured
- `source` - Data source for this measurement
- `notes` - Additional notes
- `measured_by` - Person who recorded the value
- `status` - Measurement status (recorded, verified, adjusted, deleted)
- `previous_value` - Previous value for comparison
- `change_amount` - Absolute change from previous
- `change_percentage` - Percentage change from previous
- `context` - Contextual information (activity, survey, event, period)

## Module Structure

```
src/modules/indicators/
├── schemas/
│   ├── indicator.schema.ts           # Indicator model schema
│   └── indicator-history.schema.ts   # History tracking schema
├── dto/
│   ├── create-indicator.dto.ts       # DTO for creating indicators
│   ├── update-indicator.dto.ts       # DTO for updating indicators
│   └── record-indicator-value.dto.ts # DTO for recording values
├── indicators.service.ts              # Business logic
├── indicators.controller.ts           # API endpoints
├── indicators.module.ts               # Module definition
└── index.ts                          # Exports
```

## Key Features

### 1. History Tracking
- Automatic history entry creation when recording values
- Tracks previous values and calculates changes
- Stores measurement context and metadata

### 2. Trend Calculation
- Automatic trend calculation based on recent history
- Analyzes last 5 measurements to determine trend
- Four trend states: improving, stable, declining, no_data

### 3. Value Recording
- Record new indicator values with timestamp
- Automatically updates indicator's actual value
- Calculates and stores change metrics
- Triggers trend recalculation

### 4. Formula Support
- Support for calculation formulas
- Placeholder for custom formula implementation
- Can be extended with math expression parsers

## API Endpoints

### Indicator Management

#### Create Indicator
```
POST /indicators
Body: CreateIndicatorDto
```

#### Get All Indicators
```
GET /indicators?projectId=xxx&indicatorType=output&isActive=true
```

#### Get Indicator by ID
```
GET /indicators/:id
```

#### Update Indicator
```
PATCH /indicators/:id
Body: UpdateIndicatorDto
```

#### Delete Indicator
```
DELETE /indicators/:id
```

#### Get Statistics
```
GET /indicators/statistics?projectId=xxx
```

#### Get by Project
```
GET /indicators/project/:projectId
```

#### Get by Type
```
GET /indicators/type/:type?projectId=xxx
```

#### Get by Trend
```
GET /indicators/trend/:trend?projectId=xxx
```

#### Get Off-Track Indicators
```
GET /indicators/off-track?projectId=xxx&threshold=0.7
```

#### Count Indicators
```
GET /indicators/count?projectId=xxx
```

### History & Value Recording

#### Record New Value
```
POST /indicators/:id/record-value
Body: RecordIndicatorValueDto
```

This endpoint:
- Creates a history entry
- Updates the indicator's actual value
- Calculates change from previous value
- Recalculates the trend automatically

#### Get History
```
GET /indicators/:id/history?limit=10&startDate=2024-01-01&endDate=2024-12-31
```

#### Recalculate Trend
```
POST /indicators/:id/calculate-trend
```

#### Calculate from Formula
```
POST /indicators/:id/calculate-from-formula
```

## Service Methods

### Core CRUD
- `create(dto)` - Create new indicator
- `findAll(filters)` - Find all with filters
- `findOne(id)` - Find by ID
- `update(id, dto)` - Update indicator
- `remove(id)` - Delete indicator and its history

### Query Methods
- `findByProject(projectId)` - Get all indicators for a project
- `findByType(type, projectId?)` - Get indicators by type
- `findByTrend(trend, projectId?)` - Get indicators by trend
- `findOffTrack(projectId?, threshold?)` - Get underperforming indicators
- `count(projectId?)` - Count indicators

### History & Analytics
- `recordValue(indicatorId, dto)` - Record new value and create history
- `getHistory(indicatorId, limit?, startDate?, endDate?)` - Get history entries
- `calculateTrend(indicatorId)` - Calculate trend from recent history
- `calculateFromFormula(indicatorId)` - Calculate value from formula
- `getStatistics(projectId?)` - Get aggregated statistics

## Usage Examples

### Creating an Indicator

```typescript
const indicator = await indicatorsService.create({
  project: '507f1f77bcf86cd799439011',
  indicatorType: IndicatorType.OUTPUT,
  name: 'Number of beneficiaries reached',
  description: 'Total number of individuals who received direct assistance',
  measurementMethod: 'Survey and direct counting',
  targetValue: 1000,
  unit: MeasurementUnit.NUMBER,
  baselineValue: 500,
  dataSource: 'Project database and field surveys',
  frequency: 'monthly',
});
```

### Recording a Value

```typescript
const history = await indicatorsService.recordValue(indicatorId, {
  recordedValue: 850,
  calculatedAt: new Date(),
  source: 'Field survey Q1 2024',
  notes: 'Quarterly review measurement',
  measuredBy: 'John Doe',
  status: MeasurementStatus.VERIFIED,
  context: {
    activity: 'Monthly Distribution',
    period: 'January 2024',
  },
});
```

This automatically:
- Creates a history entry
- Updates the indicator's actualValue to 850
- Calculates change from previous value
- Recalculates the trend

### Getting History

```typescript
const history = await indicatorsService.getHistory(
  indicatorId,
  10, // limit to 10 entries
  new Date('2024-01-01'),
  new Date('2024-12-31'),
);
```

### Finding Off-Track Indicators

```typescript
// Find indicators below 70% of target
const offTrack = await indicatorsService.findOffTrack(projectId, 0.7);
```

## Enums

### IndicatorType
- `INPUT` - Input indicators
- `OUTPUT` - Output indicators
- `OUTCOME` - Outcome indicators
- `IMPACT` - Impact indicators
- `PROCESS` - Process indicators
- `CUSTOM` - Custom indicators

### TrendDirection
- `IMPROVING` - Positive trend (values increasing)
- `STABLE` - Stable trend (minimal change)
- `DECLINING` - Negative trend (values decreasing)
- `NO_DATA` - Insufficient data for trend

### MeasurementUnit
- `NUMBER` - Numeric values
- `PERCENTAGE` - Percentage values
- `CURRENCY` - Monetary values
- `HOURS` - Time in hours
- `DAYS` - Time in days
- `SCORE` - Score values
- `RATING` - Rating values
- `CUSTOM` - Custom units

### MeasurementStatus
- `RECORDED` - Initial recording
- `VERIFIED` - Verified measurement
- `ADJUSTED` - Adjusted value
- `DELETED` - Soft deleted

## Authorization

All endpoints require authentication (JWT token). Role-based permissions:

- **ADMIN, MANAGER**: Full access (create, update, delete)
- **USER**: Read access + record values
- **VIEWER**: Read-only access

## Integration

To use this module in your application:

1. Import the module:
```typescript
import { IndicatorsModule } from '@modules/indicators';

@Module({
  imports: [IndicatorsModule],
})
export class AppModule {}
```

2. Use the service:
```typescript
import { IndicatorsService } from '@modules/indicators';

constructor(private indicatorsService: IndicatorsService) {}
```

## Extending the Module

### Adding Custom Formula Calculation

The `calculateFromFormula` method is a placeholder. To implement:

1. Install a math expression parser (e.g., `mathjs`)
2. Implement formula parsing and evaluation
3. Support variables from other indicators or data sources

Example implementation:

```typescript
import { evaluate } from 'mathjs';

async calculateFromFormula(indicatorId: string): Promise<number> {
  const indicator = await this.findOne(indicatorId);

  if (!indicator.calculationFormula) {
    throw new BadRequestException('No formula defined');
  }

  // Parse formula and evaluate
  const result = evaluate(indicator.calculationFormula, context);

  // Update actual value
  indicator.actualValue = result;
  await indicator.save();

  return result;
}
```

## Indexes

Optimized database indexes for performance:

### Indicator Indexes
- `{ project: 1 }`
- `{ indicatorType: 1 }`
- `{ isActive: 1 }`
- `{ project: 1, indicatorType: 1 }`
- `{ project: 1, trend: 1 }`
- `{ lastCalculatedAt: -1 }`
- `{ name: 'text', description: 'text' }`

### History Indexes
- `{ indicator: 1, calculatedAt: -1 }`
- `{ indicator: 1 }`
- `{ calculatedAt: -1 }`
- `{ status: 1 }`
- `{ createdAt: -1 }`

## Notes

- History entries are immutable (no updatedAt timestamp)
- Deleting an indicator also deletes all its history
- Trend calculation uses the last 5 measurements
- Change percentages are calculated automatically
- Achievement rate is a computed property (actualValue / targetValue * 100)
