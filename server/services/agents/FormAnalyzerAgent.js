const { groqClient, modelConfigs, makeGroqCall } = require('../../config/groq');

class FormAnalyzerAgent {
  constructor() {
    this.client = groqClient;
  }

  async analyzeForm(document) {
    const startTime = Date.now();
    
    try {
      console.log(`Starting form analysis for: ${document.name}`);

      // Perform comprehensive form analysis
      const [
        structureAnalysis,
        usabilityAnalysis,
        performancePrediction,
        complianceCheck
      ] = await Promise.all([
        this.analyzeFormStructure(document),
        this.analyzeUsability(document),
        this.predictPerformance(document),
        this.checkCompliance(document)
      ]);

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence([
        structureAnalysis,
        usabilityAnalysis,
        performancePrediction,
        complianceCheck
      ]);

      return {
        structure: structureAnalysis,
        usability: usabilityAnalysis,
        performance: performancePrediction,
        compliance: complianceCheck,
        confidence: overallConfidence,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Form analysis failed:', error);
      throw new Error(`Form analysis failed: ${error.status || error.code} ${JSON.stringify(error.error || error)}`);
    }
  }

  async analyzeFormStructure(document) {
    const prompt = `
      Analyze the structure of the following form document:
      
      Document Content:
      ${document.content}
      
      Provide a detailed analysis of the form structure including:
      
      1. Form Type: Identify the type of form (application, survey, registration, etc.)
      2. Layout Analysis: Describe the overall layout and organization
      3. Field Distribution: Analyze how fields are distributed across sections
      4. Complexity Assessment: Evaluate the complexity level
      5. Navigation Flow: Describe the logical flow of the form
      6. Section Organization: Identify and analyze different sections
      7. Field Types: Categorize different types of fields used
      8. Total Fields: Count the total number of input fields
      
      Return the result as a JSON object with the following structure:
      {
        "formType": "string",
        "layout": "string",
        "complexity": "low|medium|high",
        "sections": ["array of section names"],
        "fieldTypes": {"text": number, "checkbox": number, "radio": number, "select": number},
        "totalFields": number,
        "navigationFlow": "string",
        "confidence": number
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formAnalysis, prompt);
      return this.parseStructureAnalysis(response);
    } catch (error) {
      console.error('Structure analysis failed:', error);
      return this.getDefaultStructureAnalysis();
    }
  }

  async analyzeUsability(document) {
    const prompt = `
      Analyze the usability aspects of the following form document:
      
      Document Content:
      ${document.content}
      
      Evaluate the form's usability including:
      
      1. Clarity: How clear and understandable are the instructions and labels?
      2. Accessibility: Are there accessibility considerations?
      3. User Experience: How intuitive is the form flow?
      4. Error Prevention: How well does the form prevent user errors?
      5. Completion Rate: Predict the likely completion rate
      6. Time to Complete: Estimate the time needed to complete the form
      7. User Satisfaction: Predict user satisfaction level
      8. Improvement Areas: Identify areas for improvement
      
      Return the result as a JSON object with the following structure:
      {
        "clarity": {"score": number, "issues": ["array of issues"]},
        "accessibility": {"score": number, "issues": ["array of issues"]},
        "userExperience": {"score": number, "issues": ["array of issues"]},
        "errorPrevention": {"score": number, "issues": ["array of issues"]},
        "completionRate": number,
        "timeToComplete": number,
        "userSatisfaction": number,
        "improvementAreas": ["array of improvement suggestions"],
        "confidence": number
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formAnalysis, prompt);
      return this.parseUsabilityAnalysis(response);
    } catch (error) {
      console.error('Usability analysis failed:', error);
      return this.getDefaultUsabilityAnalysis();
    }
  }

  async predictPerformance(document) {
    const prompt = `
      Predict the performance characteristics of the following form document:
      
      Document Content:
      ${document.content}
      
      Predict performance metrics including:
      
      1. Conversion Rate: Predicted form completion rate
      2. Drop-off Points: Where users are likely to abandon the form
      3. Error Rate: Expected error rate during form completion
      4. Processing Time: Estimated time to process form submissions
      5. Scalability: How well the form will scale with increased usage
      6. Mobile Performance: How well the form will perform on mobile devices
      7. Load Time: Estimated form load time
      8. Performance Bottlenecks: Identify potential performance issues
      
      Return the result as a JSON object with the following structure:
      {
        "conversionRate": number,
        "dropOffPoints": ["array of drop-off locations"],
        "errorRate": number,
        "processingTime": number,
        "scalability": "low|medium|high",
        "mobilePerformance": "poor|fair|good|excellent",
        "loadTime": number,
        "bottlenecks": ["array of performance bottlenecks"],
        "confidence": number
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formAnalysis, prompt);
      return this.parsePerformancePrediction(response);
    } catch (error) {
      console.error('Performance prediction failed:', error);
      return this.getDefaultPerformancePrediction();
    }
  }

  async checkCompliance(document) {
    const prompt = `
      Check the compliance aspects of the following form document:
      
      Document Content:
      ${document.content}
      
      Evaluate compliance with various regulations including:
      
      1. GDPR Compliance: Data protection and privacy considerations
      2. Accessibility Standards: WCAG compliance
      3. Industry Standards: Relevant industry-specific regulations
      4. Data Security: Security requirements and best practices
      5. Legal Requirements: Legal compliance considerations
      6. Consent Management: How consent is handled
      7. Data Retention: Data retention policies
      8. Compliance Risks: Potential compliance issues
      
      Return the result as a JSON object with the following structure:
      {
        "gdpr": {"compliant": boolean, "issues": ["array of issues"]},
        "accessibility": {"compliant": boolean, "issues": ["array of issues"]},
        "industryStandards": {"compliant": boolean, "issues": ["array of issues"]},
        "dataSecurity": {"compliant": boolean, "issues": ["array of issues"]},
        "legalRequirements": {"compliant": boolean, "issues": ["array of issues"]},
        "consentManagement": {"compliant": boolean, "issues": ["array of issues"]},
        "dataRetention": {"compliant": boolean, "issues": ["array of issues"]},
        "complianceRisks": ["array of compliance risks"],
        "confidence": number
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formAnalysis, prompt);
      return this.parseComplianceCheck(response);
    } catch (error) {
      console.error('Compliance check failed:', error);
      return this.getDefaultComplianceCheck();
    }
  }

  parseStructureAnalysis(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultStructureAnalysis();
    } catch (error) {
      console.error('Failed to parse structure analysis:', error);
      return this.getDefaultStructureAnalysis();
    }
  }

  parseUsabilityAnalysis(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultUsabilityAnalysis();
    } catch (error) {
      console.error('Failed to parse usability analysis:', error);
      return this.getDefaultUsabilityAnalysis();
    }
  }

  parsePerformancePrediction(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultPerformancePrediction();
    } catch (error) {
      console.error('Failed to parse performance prediction:', error);
      return this.getDefaultPerformancePrediction();
    }
  }

  parseComplianceCheck(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultComplianceCheck();
    } catch (error) {
      console.error('Failed to parse compliance check:', error);
      return this.getDefaultComplianceCheck();
    }
  }

  getDefaultStructureAnalysis() {
    return {
      formType: 'Unknown Form',
      layout: 'Standard layout',
      complexity: 'medium',
      sections: ['General Information'],
      fieldTypes: { text: 0, checkbox: 0, radio: 0, select: 0 },
      totalFields: 0,
      navigationFlow: 'Linear',
      confidence: 0.5
    };
  }

  getDefaultUsabilityAnalysis() {
    return {
      clarity: { score: 0.7, issues: [] },
      accessibility: { score: 0.6, issues: [] },
      userExperience: { score: 0.7, issues: [] },
      errorPrevention: { score: 0.6, issues: [] },
      completionRate: 0.7,
      timeToComplete: 300,
      userSatisfaction: 0.7,
      improvementAreas: [],
      confidence: 0.5
    };
  }

  getDefaultPerformancePrediction() {
    return {
      conversionRate: 0.7,
      dropOffPoints: [],
      errorRate: 0.1,
      processingTime: 1000,
      scalability: 'medium',
      mobilePerformance: 'fair',
      loadTime: 2000,
      bottlenecks: [],
      confidence: 0.5
    };
  }

  getDefaultComplianceCheck() {
    return {
      gdpr: { compliant: false, issues: ['GDPR compliance not verified'] },
      accessibility: { compliant: false, issues: ['Accessibility not verified'] },
      industryStandards: { compliant: false, issues: ['Industry standards not verified'] },
      dataSecurity: { compliant: false, issues: ['Data security not verified'] },
      legalRequirements: { compliant: false, issues: ['Legal requirements not verified'] },
      consentManagement: { compliant: false, issues: ['Consent management not verified'] },
      dataRetention: { compliant: false, issues: ['Data retention not verified'] },
      complianceRisks: ['Compliance not fully assessed'],
      confidence: 0.3
    };
  }

  calculateOverallConfidence(analyses) {
    const confidences = analyses.map(analysis => analysis.confidence || 0.5);
    const totalConfidence = confidences.reduce((sum, conf) => sum + conf, 0);
    return totalConfidence / confidences.length;
  }
}

module.exports = { FormAnalyzerAgent }; 