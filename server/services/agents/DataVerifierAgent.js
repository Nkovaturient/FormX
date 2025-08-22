const { groqClient, modelConfigs, makeGroqCall } = require('../../config/groq');
const userDataModel = require('../../models/userDataModel');

class DataVerifierAgent {
  constructor() {
    this.client = groqClient;
  }

  async verifyUserData(userData, formRequirements) {
    const startTime = Date.now();
    
    try {
      console.log(`Starting data verification for user: ${userData.userId}`);

      // Perform comprehensive verification
      const [
        personalInfoVerification,
        contactInfoVerification,
        documentVerification,
        completenessCheck,
        complianceCheck
      ] = await Promise.all([
        this.verifyPersonalInfo(userData.personalInfo, formRequirements),
        this.verifyContactInfo(userData.contactInfo, formRequirements),
        this.verifyDocuments(userData.documents, formRequirements),
        this.checkDataCompleteness(userData, formRequirements),
        this.checkCompliance(userData, formRequirements)
      ]);

      // Calculate overall verification score
      const verificationScore = this.calculateVerificationScore([
        personalInfoVerification,
        contactInfoVerification,
        documentVerification,
        completenessCheck,
        complianceCheck
      ]);

      return {
        verified: verificationScore >= 0.8,
        score: verificationScore,
        personalInfo: personalInfoVerification,
        contactInfo: contactInfoVerification,
        documents: documentVerification,
        completeness: completenessCheck,
        compliance: complianceCheck,
        processingTime: Date.now() - startTime,
        recommendations: this.generateRecommendations([
          personalInfoVerification,
          contactInfoVerification,
          documentVerification,
          completenessCheck,
          complianceCheck
        ])
      };

    } catch (error) {
      console.error('Data verification failed:', error);
      throw new Error(`Data verification failed: ${error.message}`);
    }
  }

  async verifyPersonalInfo(personalInfo, requirements) {
    const prompt = `
      Verify the personal information against form requirements:
      
      Personal Information:
      ${JSON.stringify(personalInfo, null, 2)}
      
      Form Requirements:
      ${JSON.stringify(requirements, null, 2)}
      
      Analyze and verify:
      1. Name completeness and format
      2. Date of birth validity
      3. Gender information (if required)
      4. Nationality information (if required)
      5. Marital status (if required)
      
      Return verification result as JSON:
      {
        "verified": boolean,
        "score": number (0-1),
        "issues": ["array of issues"],
        "missing": ["array of missing fields"],
        "recommendations": ["array of recommendations"]
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataVerification, prompt);
      return this.parseVerificationResponse(response);
    } catch (error) {
      console.error('Personal info verification failed:', error);
      return this.getDefaultVerificationResult();
    }
  }

  async verifyContactInfo(contactInfo, requirements) {
    const prompt = `
      Verify the contact information against form requirements:
      
      Contact Information:
      ${JSON.stringify(contactInfo, null, 2)}
      
      Form Requirements:
      ${JSON.stringify(requirements, null, 2)}
      
      Analyze and verify:
      1. Email format and validity
      2. Phone number format
      3. Address completeness
      4. Required contact fields
      
      Return verification result as JSON:
      {
        "verified": boolean,
        "score": number (0-1),
        "issues": ["array of issues"],
        "missing": ["array of missing fields"],
        "recommendations": ["array of recommendations"]
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataVerification, prompt);
      return this.parseVerificationResponse(response);
    } catch (error) {
      console.error('Contact info verification failed:', error);
      return this.getDefaultVerificationResult();
    }
  }

  async verifyDocuments(documents, requirements) {
    const prompt = `
      Verify the uploaded documents against form requirements:
      
      Uploaded Documents:
      ${JSON.stringify(documents, null, 2)}
      
      Required Documents:
      ${JSON.stringify(requirements.requiredDocuments || [], null, 2)}
      
      Analyze and verify:
      1. Document type matching
      2. File format validity
      3. Document completeness
      4. Required document coverage
      
      Return verification result as JSON:
      {
        "verified": boolean,
        "score": number (0-1),
        "issues": ["array of issues"],
        "missing": ["array of missing documents"],
        "recommendations": ["array of recommendations"]
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataVerification, prompt);
      return this.parseVerificationResponse(response);
    } catch (error) {
      console.error('Document verification failed:', error);
      return this.getDefaultVerificationResult();
    }
  }

  async checkDataCompleteness(userData, requirements) {
    const prompt = `
      Check data completeness against form requirements:
      
      User Data:
      ${JSON.stringify(userData, null, 2)}
      
      Form Requirements:
      ${JSON.stringify(requirements, null, 2)}
      
      Analyze completeness:
      1. Required fields coverage
      2. Data quality assessment
      3. Missing critical information
      4. Optional fields status
      
      Return completeness result as JSON:
      {
        "complete": boolean,
        "score": number (0-1),
        "missingFields": ["array of missing fields"],
        "qualityIssues": ["array of quality issues"],
        "recommendations": ["array of recommendations"]
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataVerification, prompt);
      return this.parseCompletenessResponse(response);
    } catch (error) {
      console.error('Completeness check failed:', error);
      return this.getDefaultCompletenessResult();
    }
  }

  async checkCompliance(userData, requirements) {
    const prompt = `
      Check compliance with form requirements and regulations:
      
      User Data:
      ${JSON.stringify(userData, null, 2)}
      
      Form Requirements:
      ${JSON.stringify(requirements, null, 2)}
      
      Analyze compliance:
      1. Regulatory requirements
      2. Form-specific rules
      3. Data validation rules
      4. Legal compliance
      
      Return compliance result as JSON:
      {
        "compliant": boolean,
        "score": number (0-1),
        "violations": ["array of violations"],
        "warnings": ["array of warnings"],
        "recommendations": ["array of recommendations"]
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataVerification, prompt);
      return this.parseComplianceResponse(response);
    } catch (error) {
      console.error('Compliance check failed:', error);
      return this.getDefaultComplianceResult();
    }
  }

  parseVerificationResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse verification response:', error);
      return this.getDefaultVerificationResult();
    }
  }

  parseCompletenessResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse completeness response:', error);
      return this.getDefaultCompletenessResult();
    }
  }

  parseComplianceResponse(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse compliance response:', error);
      return this.getDefaultComplianceResult();
    }
  }

  calculateVerificationScore(results) {
    const scores = results.map(result => result.score || 0);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  generateRecommendations(results) {
    const recommendations = [];
    results.forEach(result => {
      if (result.recommendations) {
        recommendations.push(...result.recommendations);
      }
    });
    return [...new Set(recommendations)]; // Remove duplicates
  }

  getDefaultVerificationResult() {
    return {
      verified: false,
      score: 0,
      issues: ['Verification failed due to processing error'],
      missing: [],
      recommendations: ['Please try again or contact support']
    };
  }

  getDefaultCompletenessResult() {
    return {
      complete: false,
      score: 0,
      missingFields: ['Completeness check failed'],
      qualityIssues: [],
      recommendations: ['Please try again or contact support']
    };
  }

  getDefaultComplianceResult() {
    return {
      compliant: false,
      score: 0,
      violations: ['Compliance check failed'],
      warnings: [],
      recommendations: ['Please try again or contact support']
    };
  }
}

module.exports = { DataVerifierAgent }; 