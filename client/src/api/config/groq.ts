import Groq from 'groq-sdk';

// GROQ Configuration
export const groqConfig = {
  apiKey: `${import.meta.env.VITE_GROQ_API_KEY}`,
  models: {
    reasoning: 'deepseek-r1-distill-llama-70b',
    analysis: 'llama-3.3-70b-versatile',
    extraction: 'llama-3.3-70b-versatile', 
    generation: 'llama-3.3-70b-versatile'
  },
  defaultParams: {
    temperature: 0.6,
    max_completion_tokens: 4096,
    top_p: 0.95,
    reasoning_format: 'raw' as const
  }
};

// Initialize GROQ client
export const groqClient = new Groq({
  apiKey: groqConfig.apiKey,
  dangerouslyAllowBrowser: true // For client-side usage
});

// Model-specific configurations
export const modelConfigs = {
  formAnalysis: {
    model: groqConfig.models.reasoning,
    temperature: 0.3,
    max_completion_tokens: 8192,
    reasoning_format: 'raw' as const
  },
  dataExtraction: {
    model: groqConfig.models.extraction,
    temperature: 0.1,
    max_completion_tokens: 4096
  },
  recommendations: {
    model: groqConfig.models.analysis,
    temperature: 0.7,
    max_completion_tokens: 6144
  },
  formGeneration: {
    model: groqConfig.models.generation,
    temperature: 0.8,
    max_completion_tokens: 8192
  }
};