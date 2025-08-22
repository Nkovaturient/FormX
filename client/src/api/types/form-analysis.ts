export interface FormDocument {
  id: string;
  name: string;
  content: string;
  type: 'pdf' | 'image' | 'text';
  metadata: DocumentMetadata;
}

export interface FormAnalysisResult {
  id: string;
  timestamp: string;
  confidence: number;
  processingTime: number;
  
  structure: {
    formType: string;
    totalFields: number;
    complexity: {
      score: number;
      level: 'low' | 'medium' | 'high';
    };
    accessibility: {
      score: number;
      issues: string[];
    };
    mobileOptimization: {
      score: number;
      issues: string[];
    };
    fieldTypes: Array<{
      type: string;
      count: number;
      percentage: number;
    }>;
  };
  
  performancePrediction: {
    conversionRate: number;
    completionTime: {
      estimated: number;
      range: [number, number];
    };
    userSatisfaction: {
      predicted: number;
      factors: string[];
    };
  };
  
  complianceCheck: {
    overall: {
      score: number;
      status: 'compliant' | 'non-compliant' | 'partial';
    };
    regulations: Array<{
      name: string;
      status: 'compliant' | 'non-compliant' | 'partial';
      score: number;
      issues: string[];
    }>;
  };
  
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    impact: {
      completionRate: number;
      userSatisfaction: number;
      accessibility: number;
    };
    rationale: string;
    implementation: {
      steps: string[];
      effort: 'low' | 'medium' | 'high';
      timeEstimate: string;
    };
  }>;
  
  similarForms: Array<{
    id: string;
    name: string;
    industry: string;
    similarity: number;
    performance: {
      completionRate: number;
      averageTime: number;
      userSatisfaction: number;
    };
    keyFeatures: string[];
  }>;
}

export interface FormGenerationRequest {
  purpose: string;
  targetAudience: string;
  industry: string;
  useCase: string;
  requiredFields: string[];
  optionalFields: string[];
  complianceRequirements: string[];
  designPreferences: {
    style: 'modern' | 'classic' | 'minimal';
    layout: 'single-page' | 'multi-step' | 'wizard';
    colorScheme: 'light' | 'dark' | 'auto';
    mobileFirst: boolean;
    progressIndicator: boolean;
    autoSave: boolean;
  };
  performanceTargets: {
    maxCompletionTime: number;
    targetCompletionRate: number;
    maxErrorRate: number;
    minAccessibilityScore: number;
  };
  integrationRequirements: {
    platform: string;
    webhooks: string[];
    apiEndpoints: string[];
    dataDestinations: string[];
    notifications: string[];
  };
}

export interface GeneratedForm {
  id: string;
  name: string;
  description: string;
  implementation: {
    deployment: {
      url: string;
      platform: string;
    };
    code: {
      html: string;
      css: string;
      javascript: string;
    };
    configuration: Record<string, any>;
  };
  metadata: {
    createdAt: string;
    version: string;
    tags: string[];
  };
}


export interface DocumentMetadata {
  size: number;
  pages: number;
  uploadedAt: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'error';
}

// Form structure analysis
export interface FormStructure {
  totalFields: number;
  fieldTypes: FieldTypeDistribution[];
  sections: FormSection[];
  complexity: ComplexityMetrics;
  accessibility: AccessibilityMetrics;
  mobileOptimization: MobileOptimizationMetrics;
}

export interface FieldTypeDistribution {
  type: FieldType;
  count: number;
  percentage: number;
  examples: string[];
}

export interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
  order: number;
  isRequired: boolean;
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  validation: ValidationRule[];
  isRequired: boolean;
  position: FieldPosition;
  dependencies: FieldDependency[];
}

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'date' 
  | 'number' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'textarea' 
  | 'file' 
  | 'signature';

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
}

export interface FieldPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
}

export interface FieldDependency {
  fieldId: string;
  condition: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number | boolean;
  action: 'show' | 'hide' | 'require' | 'disable';
}

// Performance and optimization metrics
export interface ComplexityMetrics {
  score: number; // 1-10
  factors: ComplexityFactor[];
  recommendations: string[];
}

export interface ComplexityFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
}

export interface AccessibilityMetrics {
  score: number; // 1-10
  wcagCompliance: WCAGCompliance;
  issues: AccessibilityIssue[];
  recommendations: string[];
}

export interface WCAGCompliance {
  level: 'A' | 'AA' | 'AAA' | 'non-compliant';
  passedCriteria: string[];
  failedCriteria: string[];
}

export interface AccessibilityIssue {
  type: 'missing_labels' | 'poor_contrast' | 'keyboard_navigation' | 'screen_reader';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  solution: string;
  affectedFields: string[];
}

export interface MobileOptimizationMetrics {
  score: number; // 1-10
  responsiveness: ResponsivenessMetrics;
  touchTargets: TouchTargetMetrics;
  performance: PerformanceMetrics;
}

export interface ResponsivenessMetrics {
  breakpoints: BreakpointSupport[];
  layoutAdaptation: number; // 1-10
  contentPriority: number; // 1-10
}

export interface BreakpointSupport {
  size: 'mobile' | 'tablet' | 'desktop';
  supported: boolean;
  issues: string[];
}

export interface TouchTargetMetrics {
  averageSize: number;
  minimumSize: number;
  spacing: number;
  accessibility: number; // 1-10
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionDelay: number;
  score: number; // 1-10
}

// Analysis results and recommendations
// export interface FormAnalysisResult {
//   id: string;
//   documentId: string;
//   timestamp: string;
//   structure: FormStructure;
//   usabilityAnalysis: UsabilityAnalysis;
//   performancePrediction: PerformancePrediction;
//   recommendations: AnalysisRecommendation[];
//   similarForms: SimilarFormReference[];
//   complianceCheck: ComplianceAnalysis;
//   confidence: number; // 0-100
// }

export interface UsabilityAnalysis {
  userExperience: UXMetrics;
  conversionOptimization: ConversionMetrics;
  errorPrevention: ErrorPreventionMetrics;
  cognitiveLoad: CognitiveLoadMetrics;
}

export interface UXMetrics {
  score: number; // 1-10
  flowLogic: number; // 1-10
  visualHierarchy: number; // 1-10
  feedbackMechanisms: number; // 1-10
  progressIndication: number; // 1-10
}

export interface ConversionMetrics {
  predictedCompletionRate: number; // 0-100
  dropoffPoints: DropoffPoint[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface DropoffPoint {
  fieldId: string;
  fieldLabel: string;
  predictedDropoffRate: number; // 0-100
  reasons: string[];
  solutions: string[];
}

export interface OptimizationOpportunity {
  type: 'field_reduction' | 'layout_improvement' | 'validation_enhancement' | 'progress_indication';
  impact: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
  estimatedImprovement: number; // percentage
}

export interface ErrorPreventionMetrics {
  validationCoverage: number; // 0-100
  errorMessageQuality: number; // 1-10
  preventiveDesign: number; // 1-10
  recoveryMechanisms: number; // 1-10
}

export interface CognitiveLoadMetrics {
  informationDensity: number; // 1-10
  decisionComplexity: number; // 1-10
  memoryRequirements: number; // 1-10
  overallLoad: number; // 1-10
}

export interface PerformancePrediction {
  completionTime: TimeMetrics;
  userSatisfaction: SatisfactionMetrics;
  errorRate: ErrorRateMetrics;
  conversionRate: number; // 0-100
  confidence: number; // 0-100
}

export interface TimeMetrics {
  estimated: number; // minutes
  range: [number, number]; // [min, max] minutes
  factors: TimeFactor[];
}

export interface TimeFactor {
  factor: string;
  impact: number; // minutes
  description: string;
}

export interface SatisfactionMetrics {
  predicted: number; // 1-10
  factors: SatisfactionFactor[];
}

export interface SatisfactionFactor {
  factor: string;
  impact: 'positive' | 'negative';
  weight: number; // 0-1
  description: string;
}

export interface ErrorRateMetrics {
  predicted: number; // 0-100
  commonErrors: CommonError[];
  preventionStrategies: string[];
}

export interface CommonError {
  type: string;
  frequency: number; // 0-100
  impact: 'low' | 'medium' | 'high';
  prevention: string;
}

export interface AnalysisRecommendation {
  id: string;
  type: RecommendationType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  implementation: ImplementationGuide;
  impact: ImpactMetrics;
  effort: EffortMetrics;
}

export type RecommendationType = 
  | 'layout_optimization'
  | 'field_reduction'
  | 'validation_improvement'
  | 'accessibility_enhancement'
  | 'mobile_optimization'
  | 'performance_boost'
  | 'conversion_optimization'
  | 'user_experience'
  | 'compliance_fix';

export interface ImplementationGuide {
  steps: string[];
  codeExamples?: string[];
  resources: string[];
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ImpactMetrics {
  completionRate: number; // percentage change
  userSatisfaction: number; // percentage change
  errorReduction: number; // percentage change
  timeReduction: number; // percentage change
  confidence: number; // 0-100
}

export interface EffortMetrics {
  developmentTime: number; // hours
  complexity: 'low' | 'medium' | 'high';
  resources: string[];
  dependencies: string[];
}

export interface SimilarFormReference {
  id: string;
  name: string;
  industry: string;
  useCase: string;
  similarity: number; // 0-100
  performance: SimilarFormPerformance;
  keyFeatures: string[];
  lessonsLearned: string[];
}

export interface SimilarFormPerformance {
  completionRate: number; // 0-100
  averageTime: number; // minutes
  userSatisfaction: number; // 1-10
  errorRate: number; // 0-100
}

export interface ComplianceAnalysis {
  overall: ComplianceScore;
  regulations: RegulationCompliance[];
  issues: ComplianceIssue[];
  recommendations: ComplianceRecommendation[];
}

export interface ComplianceScore {
  score: number; // 0-100
  level: 'non-compliant' | 'partially_compliant' | 'compliant' | 'fully_compliant';
  lastUpdated: string;
}

export interface RegulationCompliance {
  regulation: 'GDPR' | 'HIPAA' | 'FERPA' | 'ADA' | 'CCPA' | 'SOX';
  status: 'compliant' | 'non-compliant' | 'partially_compliant' | 'not_applicable';
  requirements: RequirementCheck[];
  score: number; // 0-100
}

export interface RequirementCheck {
  requirement: string;
  status: 'met' | 'not_met' | 'partially_met';
  description: string;
  evidence?: string;
}

export interface ComplianceIssue {
  regulation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  requirement: string;
  solution: string;
  deadline?: string;
}

export interface ComplianceRecommendation {
  regulation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  implementation: string[];
  impact: string;
}