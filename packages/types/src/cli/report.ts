/**
 * Report types
 */

export interface Report {
  format: 'html' | 'json' | 'junit';
  content: string;
  metadata: Record<string, any>;
}

export interface ReportGenerator {
  generate(data: any, format: string): Promise<Report>;
}