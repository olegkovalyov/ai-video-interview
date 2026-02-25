import { register } from 'prom-client';
import { MetricsService } from '../metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(() => {
    register.clear();
    service = new MetricsService();
  });

  afterEach(() => {
    register.clear();
  });

  it('should create all custom metrics', () => {
    const metricNames = register.getMetricsAsArray().map(m => m.name);
    expect(metricNames).toContain('analysis_service_http_requests_total');
    expect(metricNames).toContain('analysis_service_http_request_duration_seconds');
    expect(metricNames).toContain('analysis_service_analysis_total');
    expect(metricNames).toContain('analysis_service_analysis_duration_seconds');
    expect(metricNames).toContain('analysis_service_llm_requests_total');
    expect(metricNames).toContain('analysis_service_llm_tokens_used');
  });

  it('should collect default metrics with correct prefix', () => {
    const metricNames = register.getMetricsAsArray().map(m => m.name);
    const hasDefaultMetrics = metricNames.some(n => n.startsWith('analysis_service_'));
    expect(hasDefaultMetrics).toBe(true);
  });

  describe('recordHttpRequest', () => {
    it('should increment HTTP counter and observe duration', () => {
      service.recordHttpRequest('GET', '/analysis', 200, 0.05);
      service.recordHttpRequest('POST', '/sandbox/analyze', 201, 1.2);

      expect(service.httpRequestsTotal).toBeDefined();
      expect(service.httpRequestDuration).toBeDefined();
    });
  });

  describe('recordAnalysis', () => {
    it('should increment analysis counter and observe duration', () => {
      service.recordAnalysis('completed', 'llama-3.3-70b', 60000);
      service.recordAnalysis('failed', 'llama-3.3-70b', 5000);

      expect(service.analysisTotal).toBeDefined();
      expect(service.analysisDuration).toBeDefined();
    });
  });

  describe('recordLlmRequest', () => {
    it('should increment LLM counter and observe tokens', () => {
      service.recordLlmRequest('success', 'question_analysis', 500);
      service.recordLlmRequest('rate_limited', 'question_analysis');

      expect(service.llmRequestsTotal).toBeDefined();
      expect(service.llmTokensUsed).toBeDefined();
    });
  });

  describe('getMetrics', () => {
    it('should return Prometheus-formatted metrics string', async () => {
      service.recordHttpRequest('GET', '/health', 200, 0.001);
      service.recordAnalysis('completed', 'test-model', 1000);

      const output = await service.getMetrics();

      expect(typeof output).toBe('string');
      expect(output).toContain('analysis_service_http_requests_total');
      expect(output).toContain('analysis_service_analysis_total');
    });
  });
});
