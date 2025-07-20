export interface TextParser {
  parse(text: string): string;
  extract(text: string, pattern: string): string[];
}