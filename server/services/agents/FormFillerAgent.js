const { groqClient, modelConfigs, makeGroqCall } = require('../../config/groq');
const fs = require('fs').promises;
const path = require('path');
const { PDFDocument: PDFLib, rgb } = require('pdf-lib');

class FormFillerAgent {
  constructor() {
    this.client = groqClient;
    this.outputDir = path.join(__dirname, '../../uploads/filled-forms');
  }

  async fillForm(originalForm, userData, formAnalysis, verificationResults) {
    const startTime = Date.now();
    
    try {
      console.log(`Starting form filling for form: ${originalForm.fileName}`);

      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Generate field mappings
      const fieldMappings = await this.generateFieldMappings(formAnalysis, userData);

      // Fill the form based on its type
      let filledFormResult;
      if (originalForm.mimeType === 'application/pdf') {
        filledFormResult = await this.fillPDFForm(originalForm, fieldMappings, userData);
      } else if (originalForm.mimeType.includes('image/')) {
        filledFormResult = await this.fillImageForm(originalForm, fieldMappings, userData);
      } else {
        filledFormResult = await this.fillTextForm(originalForm, fieldMappings, userData);
      }

      // Generate multiple output formats
      const outputFormats = await this.generateOutputFormats(filledFormResult, userData);

      // Quality assurance
      const qualityCheck = await this.performQualityCheck(filledFormResult, fieldMappings, userData);

      return {
        success: true,
        filledFormPath: filledFormResult.path,
        outputFormats,
        fieldMappings,
        qualityScore: qualityCheck.score,
        qualityIssues: qualityCheck.issues,
        processingTime: Date.now() - startTime,
        metadata: {
          originalForm: originalForm.fileName,
          userDataId: userData._id,
          verificationScore: verificationResults.score,
          totalFields: Object.keys(fieldMappings).length,
          filledFields: Object.keys(fieldMappings).filter(key => fieldMappings[key].filled).length
        }
      };

    } catch (error) {
      console.error('Form filling failed:', error);
      throw new Error(`Form filling failed: ${error.message}`);
    }
  }

  async generateFieldMappings(formAnalysis, userData) {
    const prompt = `
      Generate field mappings between form fields and user data:
      
      Form Analysis:
      ${JSON.stringify(formAnalysis, null, 2)}
      
      User Data:
      ${JSON.stringify(userData, null, 2)}
      
      Create precise field mappings that match form fields with user data:
      1. Map personal information fields
      2. Map contact information fields
      3. Map document references
      4. Handle special field types (dates, numbers, etc.)
      5. Consider field validation rules
      
      Return mappings as JSON:
      {
        "fieldMappings": {
          "fieldName": {
            "userDataPath": "path.to.user.data",
            "value": "actual_value",
            "type": "text|date|number|boolean",
            "required": boolean,
            "validation": "validation_rules",
            "filled": boolean
          }
        },
        "confidence": number (0-1),
        "unmappedFields": ["array of unmapped fields"],
        "recommendations": ["array of recommendations"]
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formFilling, prompt);
      return this.parseFieldMappings(response);
    } catch (error) {
      console.error('Field mapping generation failed:', error);
      return this.getDefaultFieldMappings();
    }
  }

  async fillPDFForm(originalForm, fieldMappings, userData) {
    try {
      const outputPath = path.join(this.outputDir, `filled_${Date.now()}_${originalForm.fileName}`);
      
      // Read the original PDF
      const pdfBytes = await fs.readFile(originalForm.filePath);
      const pdfDoc = await PDFLib.load(pdfBytes);
      const pages = pdfDoc.getPages();
      
      // Fill form fields
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      for (const [fieldName, mapping] of Object.entries(fieldMappings.fieldMappings)) {
        if (mapping.filled && mapping.value) {
          try {
            const field = form.getField(fieldName);
            if (field) {
              if (mapping.type === 'text') {
                field.setText(mapping.value.toString());
              } else if (mapping.type === 'checkbox') {
                field.check();
              } else if (mapping.type === 'radio') {
                field.select(mapping.value.toString());
              }
            }
          } catch (fieldError) {
            console.warn(`Failed to fill field ${fieldName}:`, fieldError.message);
          }
        }
      }
      
      // Save filled PDF
      const filledPdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, filledPdfBytes);
      
      return {
        path: outputPath,
        format: 'PDF',
        size: filledPdfBytes.length
      };
      
    } catch (error) {
      console.error('PDF form filling failed:', error);
      throw new Error(`PDF form filling failed: ${error.message}`);
    }
  }

  async fillImageForm(originalForm, fieldMappings, userData) {
    try {
      // Create a new PDF document
      const pdfDoc = await PDFLib.create();
      const page = pdfDoc.addPage([595, 842]); // A4 size
      
      // Add the original image as background (if available)
      try {
        const imageBytes = await fs.readFile(originalForm.filePath);
        const image = await pdfDoc.embedJpg(imageBytes); // or embedPng for PNG
        const { width, height } = image.scale(1);
        
        // Scale image to fit page
        const scaleX = 595 / width;
        const scaleY = 842 / height;
        const scale = Math.min(scaleX, scaleY);
        
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: width * scale,
          height: height * scale,
        });
      } catch (imageError) {
        console.warn('Could not embed image as background:', imageError.message);
      }
      
      // Add filled text fields with precise positioning
      for (const [fieldName, mapping] of Object.entries(fieldMappings.fieldMappings)) {
        if (mapping.filled && mapping.value && mapping.coordinates) {
          const { x, y, width, height } = mapping.coordinates;
          
          // Text positioning and formatting
          page.drawText(mapping.value.toString(), {
            x: x,
            y: 842 - y - height, // Convert from top-left to bottom-left coordinate system
            size: 12, // Font size
            color: rgb(0, 0, 0), // Black color
            maxWidth: width, // Field boundaries
            lineHeight: height,
          });
        }
      }
      
      // Save the filled PDF
      const outputPath = path.join(this.outputDir, `filled_${Date.now()}_${path.parse(originalForm.fileName).name}.pdf`);
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);
      
      return {
        path: outputPath,
        format: 'PDF',
        size: pdfBytes.length
      };
      
    } catch (error) {
      console.error('Image form filling failed:', error);
      throw new Error(`Image form filling failed: ${error.message}`);
    }
  }

  async fillTextForm(originalForm, fieldMappings, userData) {
    try {
      const outputPath = path.join(this.outputDir, `filled_${Date.now()}_${originalForm.fileName}`);
      
      // Read original form content
      const originalContent = await fs.readFile(originalForm.filePath, 'utf8');
      
      // Replace placeholders with actual values
      let filledContent = originalContent;
      for (const [fieldName, mapping] of Object.entries(fieldMappings.fieldMappings)) {
        if (mapping.filled && mapping.value) {
          const placeholder = `{{${fieldName}}}`;
          filledContent = filledContent.replace(new RegExp(placeholder, 'g'), mapping.value.toString());
        }
      }
      
      // Save filled form
      await fs.writeFile(outputPath, filledContent);
      
      return {
        path: outputPath,
        format: path.extname(originalForm.fileName).substring(1).toUpperCase(),
        size: Buffer.byteLength(filledContent, 'utf8')
      };
      
    } catch (error) {
      console.error('Text form filling failed:', error);
      throw new Error(`Text form filling failed: ${error.message}`);
    }
  }

  async generateOutputFormats(filledFormResult, userData) {
    const formats = [];
    
    try {
      // Always include the primary filled form
      formats.push({
        format: filledFormResult.format,
        path: filledFormResult.path,
        downloadUrl: `/api/forms/download/${path.basename(filledFormResult.path)}`,
        size: filledFormResult.size
      });
      
      // Generate additional formats if needed
      if (filledFormResult.format === 'PDF') {
        // Could generate DOCX, HTML, etc.
        formats.push({
          format: 'DOCX',
          path: filledFormResult.path.replace('.pdf', '.docx'),
          downloadUrl: `/api/forms/download/${path.basename(filledFormResult.path).replace('.pdf', '.docx')}`,
          note: 'Conversion available on request'
        });
      }
      
      return formats;
      
    } catch (error) {
      console.error('Output format generation failed:', error);
      return formats; // Return at least the primary format
    }
  }

  async performQualityCheck(filledFormResult, fieldMappings, userData) {
    const prompt = `
      Perform quality check on filled form:
      
      Filled Form Result:
      ${JSON.stringify(filledFormResult, null, 2)}
      
      Field Mappings:
      ${JSON.stringify(fieldMappings, null, 2)}
      
      User Data:
      ${JSON.stringify(userData, null, 2)}
      
      Check quality:
      1. Field completion rate
      2. Data accuracy
      3. Format consistency
      4. Required field coverage
      5. Data validation
      
      Return quality check as JSON:
      {
        "score": number (0-1),
        "issues": ["array of quality issues"],
        "warnings": ["array of warnings"],
        "recommendations": ["array of recommendations"],
        "completionRate": number (0-1)
      }
    `;

    try {
      const response = await makeGroqCall(modelConfigs.formFilling, prompt);
      return this.parseQualityCheck(response);
    } catch (error) {
      console.error('Quality check failed:', error);
      return this.getDefaultQualityCheck();
    }
  }

  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch (error) {
      await fs.mkdir(this.outputDir, { recursive: true });
    }
  }

  parseFieldMappings(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse field mappings:', error);
      return this.getDefaultFieldMappings();
    }
  }

  parseQualityCheck(response) {
    try {
      return JSON.parse(response);
    } catch (error) {
      console.error('Failed to parse quality check:', error);
      return this.getDefaultQualityCheck();
    }
  }

  getDefaultFieldMappings() {
    return {
      fieldMappings: {},
      confidence: 0,
      unmappedFields: [],
      recommendations: ['Field mapping failed, please review manually']
    };
  }

  getDefaultQualityCheck() {
    return {
      score: 0,
      issues: ['Quality check failed'],
      warnings: [],
      recommendations: ['Please review the filled form manually'],
      completionRate: 0
    };
  }
}

module.exports = { FormFillerAgent }; 