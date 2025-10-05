# Custom Week Configuration System

This system allows you to define custom week start and end dates for each month, providing flexibility in how weeks are calculated for reporting and statistics.

## Features

- **Custom Week Definitions**: Set custom start and end dates for each week in any month
- **Month-by-Month Configuration**: Configure different week structures for different months
- **Default Fallback**: Automatically falls back to standard Monday-Sunday weeks when no custom configuration exists
- **Validation**: Ensures weeks don't overlap and cover the entire month
- **Admin Interface**: Easy-to-use interface for managing week configurations
- **API Integration**: RESTful API for programmatic access

## Backend Implementation

### Database Schema

The system uses a MongoDB collection `weekconfigurations` with the following schema:

```javascript
{
  year: Number,           // e.g., 2024
  month: Number,          // 1-12
  weeks: [{
    weekNumber: Number,   // 1-6
    startDate: Date,
    endDate: Date,
    isActive: Boolean,
    notes: String
  }],
  createdBy: ObjectId,
  lastModifiedBy: ObjectId,
  isDefault: Boolean
}
```

### API Endpoints

- `GET /api/v1/week-config/:year/:month` - Get week configuration for a specific month
- `POST /api/v1/week-config` - Create or update week configuration
- `DELETE /api/v1/week-config/:year/:month` - Delete week configuration
- `GET /api/v1/week-config/year/:year` - Get all configurations for a year

## Frontend Implementation

### Components

1. **WeekConfigManager.vue** - Main management interface
2. **WeekConfigDialog.vue** - Create/edit week configurations
3. **WeekConfigProvider.vue** - Context provider for week configurations
4. **useWeekConfig.js** - Composable for easy week management

### Updated Components

- **orderDetails.vue** - Now uses custom week configurations for weekly statistics
- **dateUtils.js** - Enhanced with custom week functions
- **menuBar.vue** - Added navigation to week configuration

## Usage

### For Administrators

1. Navigate to "Week Configuration" in the menu
2. Select the year and month you want to configure
3. Click "Add Configuration" or "Edit Configuration"
4. Define custom week start and end dates
5. Add optional notes for each week
6. Save the configuration

### For Developers

#### Using the Composable

```javascript
import { useWeekConfig } from "@/composables/useWeekConfig.js";

const { getWeekRange, getWeeksForMonth, groupDataByCustomWeeks } =
  useWeekConfig();

// Get week range for a specific date
const weekRange = await getWeekRange("2024-01-15");

// Get all weeks for a month
const weeks = await getWeeksForMonth(2024, 1);

// Group data by custom weeks
const groupedData = await groupDataByCustomWeeks(data, "dateField", 2024, 1);
```

#### Using Date Utils

```javascript
import {
  getCustomWeekRange,
  getMonthWeeks,
  fetchWeekConfiguration,
} from "@/js/dateUtils.js";

// Get custom week range for a date
const weekRange = await getCustomWeekRange("2024-01-15");

// Get all weeks for a month
const weeks = await getMonthWeeks(2024, 1);

// Fetch week configuration
const config = await fetchWeekConfiguration(2024, 1);
```

## Migration from Standard Weeks

The system is designed to be backward compatible:

1. **Existing Data**: All existing weekly calculations continue to work
2. **Gradual Migration**: You can configure custom weeks month by month
3. **Fallback**: If no custom configuration exists, standard Monday-Sunday weeks are used
4. **No Data Loss**: Existing statistics and reports remain unchanged

## Configuration Examples

### Example 1: Bi-weekly Pay Periods (Cross-Month)

```javascript
// January 2024 - Bi-weekly pay periods that can span months
{
  year: 2024,
  month: 1,
  weeks: [
    { weekNumber: 1, startDate: '2024-01-01', endDate: '2024-01-14', isActive: true, notes: 'Pay period 1' },
    { weekNumber: 2, startDate: '2024-01-15', endDate: '2024-01-28', isActive: true, notes: 'Pay period 2' },
    { weekNumber: 3, startDate: '2024-01-29', endDate: '2024-02-11', isActive: true, notes: 'Pay period 3 (cross-month)' }
  ]
}
```

### Example 2: Quarterly Reporting Periods

```javascript
// Q1 2024 - Quarterly periods spanning multiple months
{
  year: 2024,
  month: 1,
  weeks: [
    { weekNumber: 1, startDate: '2024-01-01', endDate: '2024-01-31', isActive: true, notes: 'January' },
    { weekNumber: 2, startDate: '2024-02-01', endDate: '2024-02-29', isActive: true, notes: 'February' },
    { weekNumber: 3, startDate: '2024-03-01', endDate: '2024-03-31', isActive: true, notes: 'March' }
  ]
}
```

### Example 3: Custom Business Cycles

```javascript
// February 2024 - 10-day business cycles that can cross months
{
  year: 2024,
  month: 2,
  weeks: [
    { weekNumber: 1, startDate: '2024-02-01', endDate: '2024-02-10', isActive: true, notes: 'Cycle 1' },
    { weekNumber: 2, startDate: '2024-02-11', endDate: '2024-02-20', isActive: true, notes: 'Cycle 2' },
    { weekNumber: 3, startDate: '2024-02-21', endDate: '2024-03-02', isActive: true, notes: 'Cycle 3 (cross-month)' }
  ]
}
```

## Validation Rules

1. **No Overlaps**: Weeks cannot overlap with each other
2. **Sequential Numbering**: Week numbers must be sequential starting from 1
3. **Valid Dates**: Start and end dates must be valid dates
4. **Start Before End**: Start date must be before end date for each week
5. **Cross-Month Allowed**: Weeks can span across months for flexible business periods

## Performance Considerations

- **Caching**: Week configurations are cached to reduce API calls
- **Lazy Loading**: Configurations are loaded only when needed
- **Fallback**: Fast fallback to default weeks if API is unavailable
- **Batch Processing**: Multiple week calculations are batched for efficiency

## Troubleshooting

### Common Issues

1. **Weeks Not Updating**: Clear the cache using `clearWeekConfigCache()`
2. **API Errors**: Check backend API endpoints are properly configured
3. **Validation Errors**: Ensure weeks don't overlap and cover the entire month
4. **Performance Issues**: Consider implementing pagination for large datasets

### Debug Mode

Enable debug logging by setting:

```javascript
localStorage.setItem("debug_week_config", "true");
```

## Future Enhancements

- **Templates**: Pre-defined week configuration templates
- **Bulk Import**: Import week configurations from CSV/Excel
- **Historical Data**: View and restore previous configurations
- **Analytics**: Track usage and performance metrics
- **API Versioning**: Support for multiple API versions

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
