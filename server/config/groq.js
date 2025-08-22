const Groq = require('groq-sdk');
require('dotenv').config();

const groqConfig = {
  apiKey: process.env.GROQ_API_KEY,
  models: {
    reasoning: 'deepseek-r1-distill-llama-70b',
    analysis: 'llama-3.3-70b-versatile',
    extraction: 'llama-3.3-70b-versatile', 
    generation: 'llama-3.3-70b-versatile',
    verification: 'llama-3.3-70b-versatile',
    filling: 'llama-3.3-70b-versatile'
  },
  defaultParams: {
    temperature: 0.6,
    max_completion_tokens: 4096,
    top_p: 0.95,
    reasoning_format: 'raw'
  }
};

let groqClient;
try {
  if (!groqConfig.apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }
  groqClient = new Groq({
    apiKey: groqConfig.apiKey
  });
  console.log('Groq client initialized successfully');
} catch (error) {
  console.error('Failed to initialize Groq client:', error.message);
  groqClient = null;
}

const modelConfigs = {
  formAnalysis: {
    model: groqConfig.models.reasoning,
    temperature: 0.3,
    max_completion_tokens: 8192,
    reasoning_format: 'raw'
  },
  dataExtraction: {
    model: groqConfig.models.extraction,
    temperature: 0.1,
    max_completion_tokens: 4096,
    systemPrompt: `You are a form data extraction specialist. 
    You are given a form and you need to extract the data from the form.
    You need to extract the data from the form.
    CRITICAL: Return ONLY valid JSON arrays without any escaping issues. 
    Do not use double backslashes or escape quotes unnecessarily. 
    Do not include any explanatory text, markdown formatting, or code blocks. 
    Your responses must be parseable JSON. 
    Example: [{\"label\": \"Name\", \"type\": \"text\"}] not [{\"label\": \"Name\", \"type\": \"text\"}]`
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
  },
  dataVerification: {
    model: groqConfig.models.verification,
    temperature: 0.2,
    max_completion_tokens: 4096
  },
  formFilling: {
    model: groqConfig.models.filling,
    temperature: 0.4,
    max_completion_tokens: 6144
  }
};

async function makeGroqCall(config, prompt, systemPrompt = null) {
  if (!groqClient) {
    throw new Error('Groq client not initialized. Check GROQ_API_KEY env variable.');
  }

  try {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await groqClient.chat.completions.create({
      model: config.model,
      messages: messages,
      temperature: config.temperature,
      max_completion_tokens: config.max_completion_tokens,
      top_p: config.top_p || groqConfig.defaultParams.top_p,
      ...(config.reasoning_format && { reasoning_format: config.reasoning_format })
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API call failed:', error.message);
    if (error.status === 401) {
      throw new Error('Invalid Groq API key. Please check your GROQ_API_KEY env variable.');
    } else if (error.status === 400 && error.error?.code === 'model_decommissioned') {
      throw new Error('The specified model has been decommissioned. Please update the model configuration.');
    } else {
      throw new Error(`Groq API error: ${error.message}`);
    }
  }
}

async function makeGroqCallWithRetry(config, prompt, systemPrompt = null, options = {}) {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 800;
  let attempt = 0;
  while (true) {
    try {
      return await makeGroqCall(config, prompt, systemPrompt);
    } catch (err) {
      attempt += 1;
      const transient = typeof err.message === 'string' && (
        err.message.includes('timeout') ||
        err.message.includes('rate limit') ||
        err.message.includes('network') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('502') ||
        err.message.includes('503') ||
        err.message.includes('504')
      );
      if (!transient || attempt > maxRetries) {
        throw err;
      }
      const jitter = Math.floor(Math.random() * 250);
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;
      console.warn(`Groq retry ${attempt}/${maxRetries} after ${delay}ms due to: ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

module.exports = {
  groqConfig,
  groqClient,
  modelConfigs,
  makeGroqCall,
  makeGroqCallWithRetry
}; 