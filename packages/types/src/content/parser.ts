export interface ContentParser {
  parse(content: string, contentType: string): any;
  extract(data: any, path: string): any;
}