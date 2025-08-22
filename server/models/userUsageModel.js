const mongoose = require('mongoose');

const userUsageSchema = new mongoose.Schema({
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      unique: true 
    },
    // Current usage counts
    analysis: { type: Number, default: 0 },
    generation: { type: Number, default: 0 },
    ocr: { type: Number, default: 0 },
    
    // Plan information
    plan: { 
      type: String, 
      enum: ['free', 'personal', 'pro', 'enterprise'], 
      default: 'free' 
    },
    
    // Monthly limits based on plan
    monthlyLimits: {
        analysis: { type: Number, default: 5 },
        generation: { type: Number, default: 2 },
        ocr: { type: Number, default: 10 }
    },
    
    // Usage tracking
    lastReset: { type: Date, default: Date.now },
    currentMonth: { type: String, default: () => new Date().toISOString().slice(0, 7) }, // YYYY-MM format
    
    // Historical usage for analytics
    usageHistory: [{
        month: String, // YYYY-MM format
        analysis: Number,
        generation: Number,
        ocr: Number,
        plan: String
    }],
    
    // Plan upgrade/downgrade tracking
    planHistory: [{
        plan: String,
        changedAt: { type: Date, default: Date.now },
        reason: String
    }]
}, {
    timestamps: true
});

// Add indexes for better query performance
userUsageSchema.index({ lastReset: 1 });
userUsageSchema.index({ currentMonth: 1 });

// Instance methods
userUsageSchema.methods.resetMonthlyUsage = function() {
    // Archive current month's usage
    if (this.analysis > 0 || this.generation > 0 || this.ocr > 0) {
        this.usageHistory.push({
            month: this.currentMonth,
            analysis: this.analysis,
            generation: this.generation,
            ocr: this.ocr,
            plan: this.plan
        });
    }
    
    // Reset counters
    this.analysis = 0;
    this.generation = 0;
    this.ocr = 0;
    this.currentMonth = new Date().toISOString().slice(0, 7);
    this.lastReset = new Date();
};

userUsageSchema.methods.updatePlan = function(newPlan, reason = 'plan_change') {
    const oldPlan = this.plan;
    this.plan = newPlan;
    
    // Update monthly limits based on new plan
    const planLimits = {
        free: { analysis: 5, generation: 2, ocr: 10 },
        personal: { analysis: 50, generation: 20, ocr: 100 },
        pro: { analysis: 200, generation: 100, ocr: 500 },
        enterprise: { analysis: -1, generation: -1, ocr: -1 } // Unlimited
    };
    
    this.monthlyLimits = planLimits[newPlan] || planLimits.free;
    
    // Track plan change
    this.planHistory.push({
        plan: newPlan,
        changedAt: new Date(),
        reason: reason
    });
    
    return { oldPlan, newPlan };
};

userUsageSchema.methods.checkQuota = function(type) {
    const limit = this.monthlyLimits[type];
    const currentUsage = this[type];
    
    // Enterprise plan has unlimited usage
    if (limit === -1) return { allowed: true, remaining: -1 };
    
    return {
        allowed: currentUsage < limit,
        remaining: Math.max(0, limit - currentUsage),
        used: currentUsage,
        limit: limit
    };
};

userUsageSchema.methods.incrementUsage = function(type, count = 1) {
    const quota = this.checkQuota(type);
    if (!quota.allowed) {
        throw new Error(`Quota exceeded for ${type}. Limit: ${quota.limit}, Used: ${quota.used}`);
    }
    
    this[type] += count;
    return this.checkQuota(type);
};

const userUsageModel = mongoose.model('UserUsage', userUsageSchema);
module.exports = userUsageModel