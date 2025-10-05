// Backend API Routes: Week Configuration
// This would be implemented in your backend (Node.js/Express)

const express = require('express');
const router = express.Router();
const WeekConfiguration = require('../models/weekConfiguration');
const auth = require('../middleware/auth'); // Your auth middleware

// Get week configuration for a specific month/year
router.get('/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    let config = await WeekConfiguration.findOne({ 
      year: parseInt(year), 
      month: parseInt(month) 
    });
    
    // If no custom config exists, return default week structure
    if (!config) {
      config = await generateDefaultWeekConfig(parseInt(year), parseInt(month));
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error fetching week configuration:', error);
    res.status(500).json({ error: 'Failed to fetch week configuration' });
  }
});

// Create or update week configuration
router.post('/', auth, async (req, res) => {
  try {
    const { year, month, weeks, isDefault } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!year || !month || !weeks || !Array.isArray(weeks)) {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    
    // Validate weeks (now allows cross-month spans)
    const validationErrors = validateWeeks(weeks, year, month);
    if (validationErrors.length > 0) {
      return res.status(400).json({ errors: validationErrors });
    }
    
    // Check if configuration already exists
    let config = await WeekConfiguration.findOne({ year, month });
    
    if (config) {
      // Update existing configuration
      config.weeks = weeks;
      config.lastModifiedBy = userId;
      config.isDefault = isDefault || false;
      config.updatedAt = new Date();
      await config.save();
    } else {
      // Create new configuration
      config = new WeekConfiguration({
        year,
        month,
        weeks,
        createdBy: userId,
        lastModifiedBy: userId,
        isDefault: isDefault || false
      });
      await config.save();
    }
    
    res.json(config);
  } catch (error) {
    console.error('Error saving week configuration:', error);
    res.status(500).json({ error: 'Failed to save week configuration' });
  }
});

// Delete week configuration
router.delete('/:year/:month', auth, async (req, res) => {
  try {
    const { year, month } = req.params;
    
    const config = await WeekConfiguration.findOneAndDelete({ 
      year: parseInt(year), 
      month: parseInt(month) 
    });
    
    if (!config) {
      return res.status(404).json({ error: 'Week configuration not found' });
    }
    
    res.json({ message: 'Week configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting week configuration:', error);
    res.status(500).json({ error: 'Failed to delete week configuration' });
  }
});

// Get all configurations for a year
router.get('/year/:year', auth, async (req, res) => {
  try {
    const { year } = req.params;
    
    const configs = await WeekConfiguration.find({ 
      year: parseInt(year) 
    }).sort({ month: 1 });
    
    res.json(configs);
  } catch (error) {
    console.error('Error fetching year configurations:', error);
    res.status(500).json({ error: 'Failed to fetch year configurations' });
  }
});

// Helper function to generate default week configuration
async function generateDefaultWeekConfig(year, month) {
  const weeks = [];
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  
  // Generate standard Monday-Sunday weeks
  let currentDate = new Date(monthStart);
  let weekNumber = 1;
  
  while (currentDate <= monthEnd) {
    // Find Monday of current week
    const dayOfWeek = currentDate.getDay();
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
    
    // Find Sunday of current week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Adjust to month boundaries
    const weekStart = monday < monthStart ? monthStart : monday;
    const weekEnd = sunday > monthEnd ? monthEnd : sunday;
    
    weeks.push({
      weekNumber,
      startDate: weekStart,
      endDate: weekEnd,
      isActive: true
    });
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
    weekNumber++;
  }
  
  return {
    year,
    month,
    weeks,
    isDefault: true
  };
}

// Updated validation function - allows cross-month weeks
function validateWeeks(weeks, year, month) {
  const errors = [];
  
  if (!Array.isArray(weeks) || weeks.length === 0) {
    errors.push('At least one week must be defined');
    return errors;
  }
  
  // Check for empty dates
  weeks.forEach((week, index) => {
    if (!week.startDate || !week.endDate) {
      errors.push(`Week ${week.weekNumber}: Both start and end dates are required`);
    }
    
    // Check that start date is before end date
    if (week.startDate && week.endDate && new Date(week.startDate) >= new Date(week.endDate)) {
      errors.push(`Week ${week.weekNumber}: Start date must be before end date`);
    }
  });
  
  // Check for overlaps
  const sortedWeeks = [...weeks].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
  for (let i = 0; i < sortedWeeks.length - 1; i++) {
    const currentEnd = new Date(sortedWeeks[i].endDate);
    const nextStart = new Date(sortedWeeks[i + 1].startDate);
    
    if (currentEnd >= nextStart) {
      errors.push(`Week ${sortedWeeks[i].weekNumber} and Week ${sortedWeeks[i + 1].weekNumber} overlap`);
    }
  }
  
  // Check week numbers are sequential
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].weekNumber !== i + 1) {
      errors.push(`Week numbers must be sequential starting from 1`);
      break;
    }
  }
  
  // NO month boundary restrictions - weeks can span across months
  // This allows for flexible business periods like:
  // - Bi-weekly pay periods that cross months
  // - Quarterly reporting periods
  // - Custom business cycles
  
  return errors;
}

module.exports = router;
