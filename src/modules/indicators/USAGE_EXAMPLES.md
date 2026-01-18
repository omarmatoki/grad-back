# Indicators Module - Usage Examples

## Complete Usage Scenarios

### Example 1: Education Project - Literacy Rate Indicator

```typescript
import { IndicatorsService } from '@modules/indicators';
import { IndicatorType, MeasurementUnit } from '@modules/indicators';

// 1. Create the indicator
const literacyIndicator = await indicatorsService.create({
  project: '507f1f77bcf86cd799439011',
  indicatorType: IndicatorType.OUTCOME,
  name: 'Adult Literacy Rate',
  description: 'Percentage of adults (18+) who can read and write at basic level',
  measurementMethod: 'Standardized literacy assessment',
  targetValue: 85,
  baselineValue: 45,
  unit: MeasurementUnit.PERCENTAGE,
  dataSource: 'Quarterly literacy assessments',
  frequency: 'quarterly',
  responsiblePerson: 'Dr. Sarah Johnson',
  tags: ['education', 'literacy', 'outcome'],
  thresholds: {
    critical: 50,
    warning: 65,
    good: 75,
    excellent: 85,
  },
});

// 2. Record baseline value
await indicatorsService.recordValue(literacyIndicator._id, {
  recordedValue: 45,
  calculatedAt: new Date('2024-01-01'),
  source: 'Initial baseline assessment',
  notes: 'Conducted across 15 communities',
  measuredBy: 'Dr. Sarah Johnson',
  context: {
    period: 'Q1 2024 - Baseline',
    survey: 'Initial Assessment Survey',
  },
});

// 3. Record Q1 value
await indicatorsService.recordValue(literacyIndicator._id, {
  recordedValue: 52,
  calculatedAt: new Date('2024-03-31'),
  source: 'Q1 Assessment',
  notes: 'Positive trend after initial training sessions',
  measuredBy: 'Dr. Sarah Johnson',
  context: {
    period: 'Q1 2024',
    activity: 'Basic Literacy Training',
  },
});

// 4. Record Q2 value
await indicatorsService.recordValue(literacyIndicator._id, {
  recordedValue: 61,
  calculatedAt: new Date('2024-06-30'),
  source: 'Q2 Assessment',
  notes: 'Continued improvement with advanced training',
  measuredBy: 'Dr. Sarah Johnson',
  context: {
    period: 'Q2 2024',
    activity: 'Advanced Literacy Training',
  },
});

// 5. Check current status
const currentIndicator = await indicatorsService.findOne(literacyIndicator._id);
console.log('Current Value:', currentIndicator.actualValue); // 61
console.log('Achievement Rate:', currentIndicator.achievementRate); // 71.76%
console.log('Trend:', currentIndicator.trend); // 'improving'

// 6. Get complete history
const history = await indicatorsService.getHistory(literacyIndicator._id);
history.forEach(entry => {
  console.log(`${entry.calculatedAt}: ${entry.recordedValue}% (${entry.changePercentage?.toFixed(2)}% change)`);
});
```

### Example 2: Healthcare Project - Multiple Indicators

```typescript
// Create multiple related indicators
const healthIndicators = await Promise.all([
  // Input Indicator
  indicatorsService.create({
    project: projectId,
    indicatorType: IndicatorType.INPUT,
    name: 'Medical Staff Trained',
    description: 'Number of medical staff who completed training program',
    targetValue: 50,
    baselineValue: 0,
    unit: MeasurementUnit.NUMBER,
    dataSource: 'Training attendance records',
    frequency: 'monthly',
  }),

  // Output Indicator
  indicatorsService.create({
    project: projectId,
    indicatorType: IndicatorType.OUTPUT,
    name: 'Patients Treated',
    description: 'Number of patients who received medical treatment',
    targetValue: 5000,
    baselineValue: 0,
    unit: MeasurementUnit.NUMBER,
    dataSource: 'Hospital records',
    frequency: 'monthly',
  }),

  // Outcome Indicator
  indicatorsService.create({
    project: projectId,
    indicatorType: IndicatorType.OUTCOME,
    name: 'Patient Recovery Rate',
    description: 'Percentage of patients who fully recovered',
    targetValue: 90,
    baselineValue: 65,
    unit: MeasurementUnit.PERCENTAGE,
    dataSource: 'Follow-up surveys',
    frequency: 'monthly',
  }),
]);

// Record monthly values for all indicators
const monthlyData = [
  { month: '2024-01-31', staff: 10, patients: 450, recovery: 68 },
  { month: '2024-02-28', staff: 25, patients: 1200, recovery: 72 },
  { month: '2024-03-31', staff: 42, patients: 2800, recovery: 78 },
];

for (const data of monthlyData) {
  const date = new Date(data.month);

  await indicatorsService.recordValue(healthIndicators[0]._id, {
    recordedValue: data.staff,
    calculatedAt: date,
    source: 'Training records',
  });

  await indicatorsService.recordValue(healthIndicators[1]._id, {
    recordedValue: data.patients,
    calculatedAt: date,
    source: 'Hospital database',
  });

  await indicatorsService.recordValue(healthIndicators[2]._id, {
    recordedValue: data.recovery,
    calculatedAt: date,
    source: 'Patient follow-up survey',
  });
}

// Get project statistics
const stats = await indicatorsService.getStatistics(projectId);
console.log('Project Statistics:', stats);
```

### Example 3: Finding Off-Track Indicators

```typescript
// Get all indicators that are below 70% of target
const offTrackIndicators = await indicatorsService.findOffTrack(projectId, 0.7);

console.log(`Found ${offTrackIndicators.length} indicators off track:`);

offTrackIndicators.forEach(indicator => {
  const achievement = (indicator.actualValue / indicator.targetValue) * 100;
  console.log(`- ${indicator.name}: ${achievement.toFixed(1)}% of target`);
});

// Get detailed history for each off-track indicator
for (const indicator of offTrackIndicators) {
  const history = await indicatorsService.getHistory(indicator._id, 5);

  console.log(`\nHistory for ${indicator.name}:`);
  history.forEach(entry => {
    console.log(`  ${entry.calculatedAt.toISOString().split('T')[0]}: ${entry.recordedValue}`);
  });
}
```

### Example 4: Trend Analysis

```typescript
// Get all improving indicators
const improvingIndicators = await indicatorsService.findByTrend(
  TrendDirection.IMPROVING,
  projectId
);

// Get all declining indicators
const decliningIndicators = await indicatorsService.findByTrend(
  TrendDirection.DECLINING,
  projectId
);

// Create a performance dashboard
const dashboard = {
  improving: improvingIndicators.length,
  declining: decliningIndicators.length,
  stable: (await indicatorsService.findByTrend(TrendDirection.STABLE, projectId)).length,
  noData: (await indicatorsService.findByTrend(TrendDirection.NO_DATA, projectId)).length,
};

console.log('Project Dashboard:', dashboard);

// Alert on declining indicators
if (decliningIndicators.length > 0) {
  console.log('\n⚠️ ALERT: Declining Indicators');
  decliningIndicators.forEach(indicator => {
    console.log(`- ${indicator.name}: ${indicator.actualValue}/${indicator.targetValue}`);
  });
}
```

### Example 5: Indicator with Context and Attachments

```typescript
// Create indicator
const waterQuality = await indicatorsService.create({
  project: projectId,
  indicatorType: IndicatorType.OUTCOME,
  name: 'Water Quality Index',
  description: 'Composite water quality score based on multiple parameters',
  targetValue: 95,
  baselineValue: 60,
  unit: MeasurementUnit.SCORE,
  dataSource: 'Laboratory testing',
  frequency: 'weekly',
});

// Record value with full context
await indicatorsService.recordValue(waterQuality._id, {
  recordedValue: 78,
  calculatedAt: new Date('2024-06-15'),
  source: 'Water Testing Lab - Location A',
  notes: 'Improvement noted after filtration system installation',
  measuredBy: 'Lab Technician John Smith',
  status: MeasurementStatus.VERIFIED,
  context: {
    activity: 'Water Filtration System Installation',
    event: 'Post-Installation Testing',
    period: 'Week 24 2024',
  },
  attachments: [
    'https://storage.example.com/lab-report-2024-06-15.pdf',
    'https://storage.example.com/water-sample-photo.jpg',
  ],
  metadata: {
    testingLocation: 'Community Well A',
    temperature: 22.5,
    pH: 7.2,
    testKit: 'AquaTest Pro 3000',
  },
});
```

### Example 6: Querying and Filtering

```typescript
// Get all output indicators for a project
const outputIndicators = await indicatorsService.findByType(
  IndicatorType.OUTPUT,
  projectId
);

// Get only active indicators
const activeIndicators = await indicatorsService.findAll({
  project: projectId,
  isActive: true,
});

// Get indicators by project
const projectIndicators = await indicatorsService.findByProject(projectId);

// Count total indicators
const totalCount = await indicatorsService.count(projectId);

// Get indicators with specific tags
const educationIndicators = await indicatorsService.findAll({
  project: projectId,
  tags: 'education',
});
```

### Example 7: History with Date Ranges

```typescript
// Get last quarter's history
const lastQuarter = await indicatorsService.getHistory(
  indicatorId,
  undefined,
  new Date('2024-04-01'),
  new Date('2024-06-30')
);

// Get last 10 measurements
const recent10 = await indicatorsService.getHistory(indicatorId, 10);

// Calculate average for a period
const history = await indicatorsService.getHistory(
  indicatorId,
  undefined,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

const average = history.reduce((sum, entry) => sum + entry.recordedValue, 0) / history.length;
console.log(`Average value for 2024: ${average.toFixed(2)}`);

// Find maximum value in period
const maxEntry = history.reduce((max, entry) =>
  entry.recordedValue > max.recordedValue ? entry : max
);
console.log(`Peak value: ${maxEntry.recordedValue} on ${maxEntry.calculatedAt}`);
```

### Example 8: Updating Indicator Configuration

```typescript
// Update target value mid-project
await indicatorsService.update(indicatorId, {
  targetValue: 1200, // Increased from 1000
  notes: 'Target increased due to additional funding',
});

// Update measurement method
await indicatorsService.update(indicatorId, {
  measurementMethod: 'Updated to use digital tracking system',
  dataSource: 'Digital Dashboard v2.0',
  metadata: {
    systemVersion: '2.0',
    upgradedOn: new Date().toISOString(),
  },
});

// Deactivate indicator
await indicatorsService.update(indicatorId, {
  isActive: false,
  metadata: {
    deactivatedOn: new Date().toISOString(),
    reason: 'Project phase completed',
  },
});
```

### Example 9: Bulk Operations

```typescript
// Create multiple indicators at once
const indicatorTemplates = [
  {
    name: 'Workshops Conducted',
    indicatorType: IndicatorType.OUTPUT,
    targetValue: 50,
  },
  {
    name: 'Participants Trained',
    indicatorType: IndicatorType.OUTPUT,
    targetValue: 500,
  },
  {
    name: 'Skills Improvement Rate',
    indicatorType: IndicatorType.OUTCOME,
    targetValue: 80,
  },
];

const createdIndicators = await Promise.all(
  indicatorTemplates.map(template =>
    indicatorsService.create({
      project: projectId,
      ...template,
      description: `${template.name} for project`,
      unit: template.name.includes('Rate')
        ? MeasurementUnit.PERCENTAGE
        : MeasurementUnit.NUMBER,
    })
  )
);

// Record values for multiple indicators
const recordDate = new Date();
const values = [25, 380, 72];

await Promise.all(
  createdIndicators.map((indicator, index) =>
    indicatorsService.recordValue(indicator._id, {
      recordedValue: values[index],
      calculatedAt: recordDate,
      source: 'Monthly report',
    })
  )
);
```

### Example 10: Error Handling

```typescript
try {
  // Attempt to record value for non-existent indicator
  await indicatorsService.recordValue('invalid-id', {
    recordedValue: 100,
    calculatedAt: new Date(),
  });
} catch (error) {
  if (error instanceof NotFoundException) {
    console.error('Indicator not found');
  }
}

try {
  // Attempt to calculate from formula without formula
  await indicatorsService.calculateFromFormula(indicatorId);
} catch (error) {
  if (error instanceof BadRequestException) {
    console.error('No formula defined or formula calculation not implemented');
  }
}

// Validate before creating
function validateIndicatorData(data: CreateIndicatorDto) {
  if (data.unit === MeasurementUnit.CUSTOM && !data.customUnit) {
    throw new Error('Custom unit must be provided when unit is CUSTOM');
  }

  if (data.targetValue && data.baselineValue && data.targetValue < data.baselineValue) {
    console.warn('Warning: Target value is less than baseline');
  }
}
```

## API Usage Examples (REST Endpoints)

### Create Indicator

```bash
POST /indicators
Authorization: Bearer {token}

{
  "project": "507f1f77bcf86cd799439011",
  "indicatorType": "output",
  "name": "Beneficiaries Reached",
  "description": "Total number of beneficiaries receiving services",
  "targetValue": 1000,
  "baselineValue": 0,
  "unit": "number",
  "dataSource": "Project database",
  "frequency": "monthly"
}
```

### Record Value

```bash
POST /indicators/{indicatorId}/record-value
Authorization: Bearer {token}

{
  "recordedValue": 450,
  "calculatedAt": "2024-06-30T23:59:59.999Z",
  "source": "Monthly report",
  "notes": "Mid-year progress",
  "measuredBy": "Project Manager",
  "context": {
    "period": "June 2024",
    "activity": "Monthly distribution"
  }
}
```

### Get History

```bash
GET /indicators/{indicatorId}/history?limit=10&startDate=2024-01-01&endDate=2024-06-30
Authorization: Bearer {token}
```

### Get Off-Track Indicators

```bash
GET /indicators/off-track?projectId={projectId}&threshold=0.7
Authorization: Bearer {token}
```

### Get Statistics

```bash
GET /indicators/statistics?projectId={projectId}
Authorization: Bearer {token}
```

## Integration with Other Modules

```typescript
// In a project service
class ProjectsService {
  async getProjectDashboard(projectId: string) {
    const indicators = await this.indicatorsService.findByProject(projectId);
    const stats = await this.indicatorsService.getStatistics(projectId);
    const offTrack = await this.indicatorsService.findOffTrack(projectId);

    return {
      project: await this.findOne(projectId),
      indicators: {
        total: indicators.length,
        statistics: stats,
        offTrack: offTrack.length,
        byType: {
          input: indicators.filter(i => i.indicatorType === IndicatorType.INPUT).length,
          output: indicators.filter(i => i.indicatorType === IndicatorType.OUTPUT).length,
          outcome: indicators.filter(i => i.indicatorType === IndicatorType.OUTCOME).length,
          impact: indicators.filter(i => i.indicatorType === IndicatorType.IMPACT).length,
        },
      },
    };
  }
}
```

## Testing Examples

```typescript
describe('IndicatorsService', () => {
  it('should create indicator and record values', async () => {
    const indicator = await service.create({
      project: testProjectId,
      indicatorType: IndicatorType.OUTPUT,
      name: 'Test Indicator',
      targetValue: 100,
    });

    expect(indicator).toBeDefined();
    expect(indicator.trend).toBe(TrendDirection.NO_DATA);

    // Record first value
    await service.recordValue(indicator._id, {
      recordedValue: 50,
      calculatedAt: new Date(),
    });

    const updated = await service.findOne(indicator._id);
    expect(updated.actualValue).toBe(50);
  });

  it('should calculate trend correctly', async () => {
    const values = [10, 15, 22, 30, 40];

    for (const value of values) {
      await service.recordValue(indicatorId, {
        recordedValue: value,
        calculatedAt: new Date(),
      });
    }

    const indicator = await service.findOne(indicatorId);
    expect(indicator.trend).toBe(TrendDirection.IMPROVING);
  });
});
```
