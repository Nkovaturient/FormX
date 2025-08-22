const { groqClient, modelConfigs, makeGroqCall } = require('../../config/groq');

class DataExtractorAgent {
  constructor() {
    this.client = groqClient;
  }

  async extractFormData(document) {
    const startTime = Date.now();
    
    try {
      console.log(`Starting data extraction for: ${document.name}`);

      const [
        textFields,
        checkboxes,
        radioButtons,
        signatures,
        tables,
        sections
      ] = await Promise.all([
        this.extractTextFields(document),
        this.extractCheckboxes(document),
        this.extractRadioButtons(document),
        this.extractSignatures(document),
        this.extractTables(document),
        this.extractSections(document)
      ]);

      const allFields = [
        ...textFields,
        ...checkboxes,
        ...radioButtons,
        ...signatures,
        ...tables
      ];

      const overallConfidence = this.calculateConfidence(allFields);

      const metadata = {
        processingTime: Date.now() - startTime,
        ocrEngine: 'server-side',
        documentQuality: this.assessDocumentQuality(document),
        totalFields: allFields.length,
        extractedFields: allFields.filter(f => f.confidence > 0.7).length,
        errors: this.identifyExtractionErrors(allFields)
      };

      return {
        fields: allFields,
        sections: sections,
        metadata: metadata,
        confidence: overallConfidence
      };

    } catch (error) {
      console.error('Data extraction failed:', error);
      throw new Error(`Data extraction failed: ${error.status || error.code} ${JSON.stringify(error.error || error)}`);
    }
  }

  async extractTextFields(document) {
    const prompt = `
      Analyze the following form document and extract all text input fields.
      
      Document Content:
      ${document.content}
      
      Extract all text input fields including:
      - Input fields
      - Text areas
      - Date fields
      - Email fields
      - Phone number fields
      - Address fields
      
      For each field, provide:
      - Field label/name
      - Field type
      - Whether it's required
      - Any validation patterns
      - Position information (if available)
      - Confidence level (0-1)
      
      CRITICAL: Return ONLY a valid JSON array of field objects. Do not escape quotes or use double backslashes unnecessarily. Do not include any explanatory text, markdown formatting, or code blocks. The response must be parseable JSON.
      
      Example format:
      [
        {
          "label": "Full Name",
          "type": "text",
          "required": true,
          "validation": {"pattern": "^[a-zA-Z\\s]+$"},
          "position": {"x": 100, "y": 200, "width": 200, "height": 30},
          "confidence": 0.95
        }
      ]
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataExtraction, prompt, modelConfigs.dataExtraction.systemPrompt);
      return this.parseExtractedFields(response, 'text');
    } catch (error) {
      console.error('Text field extraction failed:', error);
      return [];
    }
  }

  async extractCheckboxes(document) {
    const prompt = `
      Analyze the following form document and extract all checkbox fields.
      
      Document Content:
      ${document.content}
      
      Extract all checkbox fields including:
      - Checkboxes
      - Boolean fields
      - Yes/No questions
      - Terms and conditions checkboxes
      
      For each checkbox, provide:
      - Field label/description
      - Default state (checked/unchecked)
      - Whether it's required
      - Position information (if available)
      - Confidence level (0-1)
      
      CRITICAL: Return ONLY a valid JSON array of checkbox objects. Do not escape quotes or use double backslashes unnecessarily. Do not include any explanatory text, markdown formatting, or code blocks. The response must be parseable JSON.
      
      Example format:
      [
        {
          "label": "I agree to terms",
          "type": "checkbox",
          "defaultState": false,
          "required": true,
          "position": {"x": 100, "y": 300, "width": 20, "height": 20},
          "confidence": 0.9
        }
      ]
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataExtraction, prompt, modelConfigs.dataExtraction.systemPrompt);
      return this.parseExtractedFields(response, 'checkbox');
    } catch (error) {
      console.error('Checkbox extraction failed:', error);
      return [];
    }
  }

  async extractRadioButtons(document) {
    const prompt = `
      Analyze the following form document and extract all radio button groups.
      
      Document Content:
      ${document.content}
      
      Extract all radio button groups including:
      - Multiple choice questions
      - Radio button selections
      - Option groups
      
      For each radio group, provide:
      - Group label/question
      - Available options
      - Default selection (if any)
      - Whether it's required
      - Position information (if available)
      - Confidence level (0-1)
      
      CRITICAL: Return ONLY a valid JSON array of radio group objects. Do not escape quotes or use double backslashes unnecessarily. Do not include any explanatory text, markdown formatting, or code blocks. The response must be parseable JSON.
      
      Example format:
      [
        {
          "label": "Gender",
          "type": "radio",
          "options": ["Male", "Female", "Other"],
          "defaultSelection": null,
          "required": true,
          "position": {"x": 100, "y": 400, "width": 150, "height": 60},
          "confidence": 0.85
        }
      ]
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataExtraction, prompt, modelConfigs.dataExtraction.systemPrompt);
      return this.parseExtractedFields(response, 'radio');
    } catch (error) {
      console.error('Radio button extraction failed:', error);
      return [];
    }
  }

  async extractSignatures(document) {
    const prompt = `
      Analyze the following form document and identify signature fields.
      
      Document Content:
      ${document.content}
      
      Look for signature fields including:
      - Signature lines
      - Digital signature requirements
      - Authorized person signatures
      - Witness signatures
      
      For each signature field, provide:
      - Field label/description
      - Signature type
      - Whether it's required
      - Position information (if available)
      - Confidence level (0-1)
      
      CRITICAL: Return ONLY a valid JSON array of signature field objects. Do not escape quotes or use double backslashes unnecessarily. Do not include any explanatory text, markdown formatting, or code blocks. The response must be parseable JSON.
      
      Example format:
      [
        {
          "label": "Authorized Signature",
          "type": "signature",
          "signatureType": "authorized_person",
          "required": true,
          "position": {"x": 100, "y": 500, "width": 200, "height": 50},
          "confidence": 0.9
        }
      ]
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataExtraction, prompt, modelConfigs.dataExtraction.systemPrompt);
      return this.parseExtractedFields(response, 'signature');
    } catch (error) {
      console.error('Signature extraction failed:', error);
      return [];
    }
  }

  async extractTables(document) {
    const prompt = `
      Analyze the following form document and extract table structures.
      
      Document Content:
      ${document.content}
      
      Look for table structures including:
      - Data tables
      - Grid layouts
      - Tabular information
      - Structured data fields
      
      For each table, provide:
      - Table title/description
      - Column headers
      - Row structure
      - Data types
      - Position information (if available)
      - Confidence level (0-1)
      
      CRITICAL: Return ONLY a valid JSON array of table objects. Do not escape quotes or use double backslashes unnecessarily. Do not include any explanatory text, markdown formatting, or code blocks. The response must be parseable JSON.
      
      Example format:
      [
        {
          "label": "Employment History",
          "type": "table",
          "columns": ["Company", "Position", "Duration"],
          "rows": 5,
          "position": {"x": 100, "y": 600, "width": 400, "height": 200},
          "confidence": 0.85
        }
      ]
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataExtraction, prompt, modelConfigs.dataExtraction.systemPrompt);
      return this.parseExtractedFields(response, 'table');
    } catch (error) {
      console.error('Table extraction failed:', error);
      return [];
    }
  }

  async extractSections(document) {
    const prompt = `
      Analyze the following form document and identify form sections.
      
      Document Content:
      ${document.content}
      
      Identify logical sections including:
      - Personal information
      - Contact details
      - Employment history
      - Education background
      - References
      - Terms and conditions
      
      For each section, provide:
      - Section title
      - Section description
      - Fields included in the section
      - Order/sequence
      - Confidence level (0-1)
      
      CRITICAL: Return ONLY a valid JSON array of section objects. Do not escape quotes or use double backslashes unnecessarily. Do not include any explanatory text, markdown formatting, or code blocks. The response must be parseable JSON.
      
      Example format:
      [
        {
          "title": "Personal Information",
          "description": "Basic personal details",
          "fields": ["name", "email", "phone"],
          "order": 1,
          "confidence": 0.9
        }
      ]
    `;

    try {
      const response = await makeGroqCall(modelConfigs.dataExtraction, prompt, modelConfigs.dataExtraction.systemPrompt);
      return this.parseExtractedSections(response);
    } catch (error) {
      console.error('Section extraction failed:', error);
      return [];
    }
  }

  parseExtractedFields(response, defaultType) {
    try {
      console.log(`Parsing extracted fields for type: ${defaultType}`);
      console.log(`Raw response length: ${response?.length || 0}`);
      
      if (!response || typeof response !== 'string') {
        console.warn('Invalid response format - not a string');
        return [];
      }

      // Try multiple parsing strategies
      let fields = [];

      // Strategy 1: Look for JSON array pattern
      const jsonArrayMatch = response.match(/\[[\s\S]*\]/);
      if (jsonArrayMatch) {
        try {
          const parsed = JSON.parse(jsonArrayMatch[0]);
          if (Array.isArray(parsed)) {
            fields = parsed;
            console.log(`Successfully parsed ${fields.length} fields using JSON array strategy`);
          }
        } catch (parseError) {
          console.warn('JSON array parsing failed:', parseError.message);
        }
      }

      // Strategy 2: Look for JSON object pattern if array failed
      if (fields.length === 0) {
        const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          try {
            const parsed = JSON.parse(jsonObjectMatch[0]);
            if (parsed.fields && Array.isArray(parsed.fields)) {
              fields = parsed.fields;
              console.log(`Successfully parsed ${fields.length} fields using JSON object strategy`);
            } else if (parsed.data && Array.isArray(parsed.data)) {
              fields = parsed.data;
              console.log(`Successfully parsed ${fields.length} fields using JSON data strategy`);
            }
          } catch (parseError) {
            console.warn('JSON object parsing failed:', parseError.message);
          }
        }
      }

      // Strategy 3: Try to extract JSON from markdown code blocks
      if (fields.length === 0) {
        const codeBlockMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          try {
            const parsed = JSON.parse(codeBlockMatch[1]);
            if (Array.isArray(parsed)) {
              fields = parsed;
              console.log(`Successfully parsed ${fields.length} fields using code block strategy`);
            }
          } catch (parseError) {
            console.warn('Code block parsing failed:', parseError.message);
          }
        }
      }

      // Strategy 4: Try to find any valid JSON in the response
      if (fields.length === 0) {
        const jsonMatches = response.match(/\{[^{}]*"fields"[^{}]*\[[^\]]*\][^{}]*\}/g);
        if (jsonMatches) {
          for (const match of jsonMatches) {
            try {
              const parsed = JSON.parse(match);
              if (parsed.fields && Array.isArray(parsed.fields)) {
                fields = parsed.fields;
                console.log(`Successfully parsed ${fields.length} fields using flexible JSON strategy`);
                break;
              }
            } catch (parseError) {
              // Continue to next match
            }
          }
        }
      }

      // Strategy 5: Handle escaped characters in JSON
      if (fields.length === 0) {
        try {
          // Try to fix common JSON escaping issues
          let cleanedResponse = response
            .replace(/\\"/g, '"')  // Fix double-escaped quotes
            .replace(/\\\\/g, '\\') // Fix double-escaped backslashes
            .replace(/\\n/g, '')   // Remove escaped newlines
            .replace(/\\t/g, '')   // Remove escaped tabs
            .replace(/\\r/g, '');  // Remove escaped carriage returns
          
          const jsonArrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);
          if (jsonArrayMatch) {
            const parsed = JSON.parse(jsonArrayMatch[0]);
            if (Array.isArray(parsed)) {
              fields = parsed;
              console.log(`Successfully parsed ${fields.length} fields using escaped character fix strategy`);
            }
          }
        } catch (parseError) {
          console.warn('Escaped character fix strategy failed:', parseError.message);
        }
      }

      // Strategy 6: Manual JSON reconstruction for complex cases
      if (fields.length === 0) {
        try {
          // Look for field patterns and manually reconstruct JSON
          const fieldMatches = response.match(/"label":\s*"[^"]*"[^}]*}/g);
          if (fieldMatches && fieldMatches.length > 0) {
            const reconstructedFields = fieldMatches.map(match => {
              try {
                // Clean up the match and parse individual field
                const cleanedMatch = match.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                return JSON.parse(cleanedMatch);
              } catch (e) {
                return null;
              }
            }).filter(field => field !== null);
            
            if (reconstructedFields.length > 0) {
              fields = reconstructedFields;
              console.log(`Successfully parsed ${fields.length} fields using manual reconstruction strategy`);
            }
          }
        } catch (parseError) {
          console.warn('Manual reconstruction strategy failed:', parseError.message);
        }
      }

      // If all strategies failed, log the response for debugging
      if (fields.length === 0) {
        console.error('All parsing strategies failed. Response preview:', response.substring(0, 500));
        console.error('Full response:', response);
        return [];
      }

      // Normalize and validate fields
      const normalizedFields = fields
        .filter(field => field && typeof field === 'object')
        .map(field => this.normalizeExtractedField(field, defaultType))
        .filter(field => field.label && field.label !== 'Unknown Field');

      console.log(`Final normalized fields: ${normalizedFields.length}`);
      return normalizedFields;

    } catch (error) {
      console.error('Failed to parse extracted fields:', error);
      console.error('Response that caused error:', response?.substring(0, 500));
      return [];
    }
  }

  parseExtractedSections(response) {
    try {
      console.log('Parsing extracted sections');
      console.log(`Raw response length: ${response?.length || 0}`);
      
      if (!response || typeof response !== 'string') {
        console.warn('Invalid response format - not a string');
        return [];
      }

      // Try multiple parsing strategies
      let sections = [];

      // Strategy 1: Look for JSON array pattern
      const jsonArrayMatch = response.match(/\[[\s\S]*\]/);
      if (jsonArrayMatch) {
        try {
          const parsed = JSON.parse(jsonArrayMatch[0]);
          if (Array.isArray(parsed)) {
            sections = parsed;
            console.log(`Successfully parsed ${sections.length} sections using JSON array strategy`);
          }
        } catch (parseError) {
          console.warn('JSON array parsing failed:', parseError.message);
        }
      }

      // Strategy 2: Look for JSON object pattern
      if (sections.length === 0) {
        const jsonObjectMatch = response.match(/\{[\s\S]*\}/);
        if (jsonObjectMatch) {
          try {
            const parsed = JSON.parse(jsonObjectMatch[0]);
            if (parsed.sections && Array.isArray(parsed.sections)) {
              sections = parsed.sections;
              console.log(`Successfully parsed ${sections.length} sections using JSON object strategy`);
            }
          } catch (parseError) {
            console.warn('JSON object parsing failed:', parseError.message);
          }
        }
      }

      // Strategy 3: Try to extract JSON from markdown code blocks
      if (sections.length === 0) {
        const codeBlockMatch = response.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
        if (codeBlockMatch) {
          try {
            const parsed = JSON.parse(codeBlockMatch[1]);
            if (Array.isArray(parsed)) {
              sections = parsed;
              console.log(`Successfully parsed ${sections.length} sections using code block strategy`);
            }
          } catch (parseError) {
            console.warn('Code block parsing failed:', parseError.message);
          }
        }
      }

      // If all strategies failed, log the response for debugging
      if (sections.length === 0) {
        console.error('All parsing strategies failed for sections. Response preview:', response.substring(0, 500));
        return [];
      }

      // Validate sections
      const validSections = sections
        .filter(section => section && typeof section === 'object')
        .map(section => ({
          id: section.id || `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: section.title || section.name || 'Unknown Section',
          description: section.description || '',
          fields: section.fields || [],
          position: section.position || { x: 0, y: 0, width: 0, height: 0 },
          confidence: section.confidence || 0.8
        }));

      console.log(`Final valid sections: ${validSections.length}`);
      return validSections;

    } catch (error) {
      console.error('Failed to parse extracted sections:', error);
      console.error('Response that caused error:', response?.substring(0, 500));
      return [];
    }
  }

  normalizeExtractedField(rawField, defaultType) {
    return {
      id: rawField.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: rawField.type || defaultType,
      label: rawField.label || rawField.name || 'Unknown Field',
      value: rawField.value || '',
      confidence: rawField.confidence || 0.8,
      position: rawField.position || { x: 0, y: 0, width: 0, height: 0 },
      validation: {
        required: rawField.required || false,
        pattern: rawField.pattern,
        minLength: rawField.minLength,
        maxLength: rawField.maxLength
      },
      metadata: {
        font: rawField.font,
        fontSize: rawField.fontSize,
        color: rawField.color,
        background: rawField.background
      }
    };
  }

  calculateConfidence(fields) {
    if (fields.length === 0) return 0;
    const totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0);
    return totalConfidence / fields.length;
  }

  assessDocumentQuality(document) {
    // Simple quality assessment based on content length and structure
    const contentLength = document.content.length;
    const hasStructure = document.content.includes('form') || document.content.includes('field');
    
    if (contentLength > 1000 && hasStructure) return 0.9;
    if (contentLength > 500) return 0.7;
    return 0.5;
  }

  identifyExtractionErrors(fields) {
    const errors = [];
    
    fields.forEach(field => {
      if (field.confidence < 0.5) {
        errors.push({
          type: 'low_confidence',
          message: `Low confidence extraction for field: ${field.label}`,
          fieldId: field.id,
          severity: 'medium'
        });
      }
      
      if (!field.label || field.label === 'Unknown Field') {
        errors.push({
          type: 'unrecognized_field',
          message: `Could not identify field label`,
          fieldId: field.id,
          severity: 'high'
        });
      }
    });
    
    return errors;
  }
}

module.exports = { DataExtractorAgent }; 