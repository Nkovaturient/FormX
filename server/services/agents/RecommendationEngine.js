const { groqClient, modelConfigs, makeGroqCall } = require('../../config/groq');

class RecommendationEngine {
  constructor() {
    this.client = groqClient;
  }

  async generateContextualRecommendations(analysis, context = {}) {
    const startTime = Date.now();
    
    try {
      console.log('Generating contextual recommendations');

      const [
        usabilityRecommendations,
        performanceRecommendations,
        complianceRecommendations,
        optimizationRecommendations
      ] = await Promise.all([
        this.generateUsabilityRecommendations(analysis, context),
        this.generatePerformanceRecommendations(analysis, context),
        this.generateComplianceRecommendations(analysis, context),
        this.generateOptimizationRecommendations(analysis, context)
      ]);

      // Combine all recommendations
      const allRecommendations = [
        ...usabilityRecommendations,
        ...performanceRecommendations,
        ...complianceRecommendations,
        ...optimizationRecommendations
      ];

      // Prioritize recommendations
      const prioritizedRecommendations = this.prioritizeRecommendations(allRecommendations);

      return {
        recommendations: prioritizedRecommendations,
        summary: this.generateRecommendationSummary(prioritizedRecommendations),
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Recommendation generation failed:', error);
      throw new Error(`Recommendation generation failed: ${error.status || error.code} ${JSON.stringify(error.error || error)}`);
    }
  }

  async generateUsabilityRecommendations(analysis, context) {
    const prompt = `
      Based on the form analysis, generate usability improvement recommendations:
      
      Form Analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Context:
      ${JSON.stringify(context, null, 2)}
      
      Generate specific, actionable recommendations for improving form usability including:
      
      1. Clarity improvements
      2. Accessibility enhancements
      3. User experience optimizations
      4. Error prevention strategies
      5. Completion rate improvements
      
      For each recommendation, provide:
      - Title: Short, descriptive title
      - Description: Detailed explanation
      - Impact: High/Medium/Low
      - Effort: High/Medium/Low
      - Priority: 1-5 (1 being highest)
      - Category: usability
      
      Return as a JSON array of recommendation objects.
    `;

    try {
      const response = await makeGroqCall(modelConfigs.recommendations, prompt);
      return this.parseRecommendations(response, 'usability');
    } catch (error) {
      console.error('Usability recommendations failed:', error);
      return this.getDefaultUsabilityRecommendations();
    }
  }

  async generatePerformanceRecommendations(analysis, context) {
    const prompt = `
      Based on the form analysis, generate performance optimization recommendations:
      
      Form Analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Context:
      ${JSON.stringify(context, null, 2)}
      
      Generate specific, actionable recommendations for improving form performance including:
      
      1. Load time optimizations
      2. Processing efficiency improvements
      3. Scalability enhancements
      4. Mobile performance optimizations
      5. Conversion rate improvements
      
      For each recommendation, provide:
      - Title: Short, descriptive title
      - Description: Detailed explanation
      - Impact: High/Medium/Low
      - Effort: High/Medium/Low
      - Priority: 1-5 (1 being highest)
      - Category: performance
      
      Return as a JSON array of recommendation objects.
    `;

    try {
      const response = await makeGroqCall(modelConfigs.recommendations, prompt);
      return this.parseRecommendations(response, 'performance');
    } catch (error) {
      console.error('Performance recommendations failed:', error);
      return this.getDefaultPerformanceRecommendations();
    }
  }

  async generateComplianceRecommendations(analysis, context) {
    const prompt = `
      Based on the form analysis, generate compliance improvement recommendations:
      
      Form Analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Context:
      ${JSON.stringify(context, null, 2)}
      
      Generate specific, actionable recommendations for improving form compliance including:
      
      1. GDPR compliance improvements
      2. Accessibility enhancements
      3. Data security improvements
      4. Legal compliance updates
      5. Industry standard adherence
      
      For each recommendation, provide:
      - Title: Short, descriptive title
      - Description: Detailed explanation
      - Impact: High/Medium/Low
      - Effort: High/Medium/Low
      - Priority: 1-5 (1 being highest)
      - Category: compliance
      
      Return as a JSON array of recommendation objects.
    `;

    try {
      const response = await makeGroqCall(modelConfigs.recommendations, prompt);
      return this.parseRecommendations(response, 'compliance');
    } catch (error) {
      console.error('Compliance recommendations failed:', error);
      return this.getDefaultComplianceRecommendations();
    }
  }

  async generateOptimizationRecommendations(analysis, context) {
    const prompt = `
      Based on the form analysis, generate general optimization recommendations:
      
      Form Analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Context:
      ${JSON.stringify(context, null, 2)}
      
      Generate specific, actionable recommendations for general form optimization including:
      
      1. Structure improvements
      2. Field optimization
      3. Layout enhancements
      4. User flow improvements
      5. Technology upgrades
      
      For each recommendation, provide:
      - Title: Short, descriptive title
      - Description: Detailed explanation
      - Impact: High/Medium/Low
      - Effort: High/Medium/Low
      - Priority: 1-5 (1 being highest)
      - Category: optimization
      
      Return as a JSON array of recommendation objects.
    `;

    try {
      const response = await makeGroqCall(modelConfigs.recommendations, prompt);
      return this.parseRecommendations(response, 'optimization');
    } catch (error) {
      console.error('Optimization recommendations failed:', error);
      return this.getDefaultOptimizationRecommendations();
    }
  }

  async generateOptimizationRoadmap(analysis, targetGoals, timeframe) {
    const prompt = `
      Based on the form analysis and target goals, generate an optimization roadmap:
      
      Form Analysis:
      ${JSON.stringify(analysis, null, 2)}
      
      Target Goals:
      ${JSON.stringify(targetGoals, null, 2)}
      
      Timeframe: ${timeframe}
      
      Generate a detailed optimization roadmap with:
      
      1. Phase 1 (Immediate - 0-2 weeks): Quick wins and critical fixes
      2. Phase 2 (Short-term - 2-4 weeks): Medium-impact improvements
      3. Phase 3 (Medium-term - 1-3 months): Strategic enhancements
      4. Phase 4 (Long-term - 3-6 months): Major optimizations
      
      For each phase, provide:
      - Phase name and duration
      - Objectives
      - Key deliverables
      - Success metrics
      - Resource requirements
      - Dependencies
      
      Return as a JSON object with phases array.
    `;

    try {
      const response = await makeGroqCall(modelConfigs.recommendations, prompt);
      return this.parseOptimizationRoadmap(response);
    } catch (error) {
      console.error('Optimization roadmap generation failed:', error);
      return this.getDefaultOptimizationRoadmap();
    }
  }

  async findBestPractices(formType = 'general', industry = 'general', useCase = 'general') {
    const prompt = `
      Provide best practices for form design and optimization:
      
      Form Type: ${formType}
      Industry: ${industry}
      Use Case: ${useCase}
      
      Generate comprehensive best practices covering:
      
      1. Design Principles
      2. User Experience Guidelines
      3. Accessibility Standards
      4. Performance Best Practices
      5. Security Considerations
      6. Compliance Requirements
      7. Industry-Specific Guidelines
      
      For each category, provide:
      - Key principles
      - Specific guidelines
      - Implementation tips
      - Common pitfalls to avoid
      
      Return as a JSON object with categorized best practices.
    `;

    try {
      const response = await makeGroqCall(modelConfigs.recommendations, prompt);
      return this.parseBestPractices(response);
    } catch (error) {
      console.error('Best practices generation failed:', error);
      return this.getDefaultBestPractices();
    }
  }

  parseRecommendations(response, category) {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        return recommendations.map(rec => ({
          ...rec,
          category: category,
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to parse recommendations:', error);
      return [];
    }
  }

  parseOptimizationRoadmap(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultOptimizationRoadmap();
    } catch (error) {
      console.error('Failed to parse optimization roadmap:', error);
      return this.getDefaultOptimizationRoadmap();
    }
  }

  parseBestPractices(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultBestPractices();
    } catch (error) {
      console.error('Failed to parse best practices:', error);
      return this.getDefaultBestPractices();
    }
  }

  prioritizeRecommendations(recommendations) {
    // Sort by priority (1 being highest) and then by impact
    return recommendations.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      
      const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  generateRecommendationSummary(recommendations) {
    const summary = {
      total: recommendations.length,
      byCategory: {},
      byPriority: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byImpact: { High: 0, Medium: 0, Low: 0 }
    };

    recommendations.forEach(rec => {
      // Count by category
      summary.byCategory[rec.category] = (summary.byCategory[rec.category] || 0) + 1;
      
      // Count by priority
      summary.byPriority[rec.priority] = (summary.byPriority[rec.priority] || 0) + 1;
      
      // Count by impact
      summary.byImpact[rec.impact] = (summary.byImpact[rec.impact] || 0) + 1;
    });

    return summary;
  }

  getDefaultUsabilityRecommendations() {
    return [
      {
        id: 'rec_usability_1',
        title: 'Improve Form Clarity',
        description: 'Add clear instructions and labels to improve user understanding',
        impact: 'High',
        effort: 'Medium',
        priority: 1,
        category: 'usability'
      }
    ];
  }

  getDefaultPerformanceRecommendations() {
    return [
      {
        id: 'rec_performance_1',
        title: 'Optimize Form Loading',
        description: 'Implement lazy loading and optimize assets for faster form loading',
        impact: 'Medium',
        effort: 'High',
        priority: 2,
        category: 'performance'
      }
    ];
  }

  getDefaultComplianceRecommendations() {
    return [
      {
        id: 'rec_compliance_1',
        title: 'Add Privacy Policy',
        description: 'Include clear privacy policy and data handling information',
        impact: 'High',
        effort: 'Medium',
        priority: 1,
        category: 'compliance'
      }
    ];
  }

  getDefaultOptimizationRecommendations() {
    return [
      {
        id: 'rec_optimization_1',
        title: 'Streamline Form Flow',
        description: 'Simplify the form structure and reduce unnecessary fields',
        impact: 'High',
        effort: 'Medium',
        priority: 1,
        category: 'optimization'
      }
    ];
  }

  getDefaultOptimizationRoadmap() {
    return {
      phases: [
        {
          name: 'Phase 1: Quick Wins',
          duration: '0-2 weeks',
          objectives: ['Fix critical issues', 'Implement quick improvements'],
          deliverables: ['Bug fixes', 'Basic optimizations'],
          successMetrics: ['Reduced errors', 'Improved load time'],
          resourceRequirements: 'Low',
          dependencies: 'None'
        }
      ]
    };
  }

  getDefaultBestPractices() {
    return {
      designPrinciples: ['Keep it simple', 'Use clear labels', 'Provide feedback'],
      userExperience: ['Minimize cognitive load', 'Use progressive disclosure'],
      accessibility: ['Use semantic HTML', 'Provide alt text', 'Ensure keyboard navigation'],
      performance: ['Optimize images', 'Minimize HTTP requests', 'Use caching'],
      security: ['Validate inputs', 'Use HTTPS', 'Implement CSRF protection'],
      compliance: ['Follow GDPR guidelines', 'Include privacy notices'],
      industrySpecific: ['Follow industry standards', 'Consider regulatory requirements']
    };
  }
}

module.exports = { RecommendationEngine }; 