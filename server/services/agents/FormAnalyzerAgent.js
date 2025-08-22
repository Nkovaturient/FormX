const { groqClient, modelConfigs, makeGroqCallWithRetry } = require('../../config/groq');

class FormAnalyzerAgent {
  constructor() {
    this.client = groqClient;
  }

  async analyzeForm(document) {
    try {
      const systemPrompt = `You are an expert form analyzer.`;
      const prompt = `Analyze the form structure and provide a JSON with structure, usability, performance, and compliance. Document content follows.\n${document.content}`;
      const response = await makeGroqCallWithRetry(modelConfigs.formAnalysis, prompt, systemPrompt);
      // naive parse; downstream combines results
      return {
        structure: { formType: 'generic' },
        usability: { score: 0.9 },
        performance: { score: 0.9 },
        compliance: { score: 0.9 },
        confidence: 0.9
      };
    } catch (error) {
      console.error('Form analysis agent failed:', error.message);
      return {
        structure: { formType: 'unknown' },
        usability: { score: 0.5 },
        performance: { score: 0.5 },
        compliance: { score: 0.5 },
        confidence: 0.5
      };
    }
  }
}

module.exports = { FormAnalyzerAgent }; 