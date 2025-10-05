// Backend Model: Week Configuration
// This would be implemented in your backend (Node.js/Express/MongoDB)

const mongoose = require('mongoose');

const weekConfigurationSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    index: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
    index: true
  },
  weeks: [{
    weekNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 10 // Increased to allow more weeks and cross-month spans
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      maxlength: 500
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
weekConfigurationSchema.index({ year: 1, month: 1 }, { unique: true });

// Updated validation - allows cross-month weeks, no month boundary restrictions
weekConfigurationSchema.pre('save', function(next) {
  const weeks = this.weeks.sort((a, b) => a.weekNumber - b.weekNumber);
  
  // Check for overlaps
  for (let i = 0; i < weeks.length - 1; i++) {
    if (weeks[i].endDate >= weeks[i + 1].startDate) {
      return next(new Error('Weeks cannot overlap'));
    }
  }
  
  // Check week numbers are sequential
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].weekNumber !== i + 1) {
      return next(new Error('Week numbers must be sequential starting from 1'));
    }
  }
  
  // Check that start date is before end date for each week
  for (let i = 0; i < weeks.length; i++) {
    if (weeks[i].startDate >= weeks[i].endDate) {
      return next(new Error(`Week ${weeks[i].weekNumber}: Start date must be before end date`));
    }
  }
  
  // NO month boundary restrictions - weeks can span across months
  // This allows for flexible business periods like:
  // - Bi-weekly pay periods that cross months
  // - Quarterly reporting periods
  // - Custom business cycles
  
  next();
});

module.exports = mongoose.model('WeekConfiguration', weekConfigurationSchema);
