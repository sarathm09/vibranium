export interface JSONPathParser {
  query(data: any, path: string): any[];
  queryFirst(data: any, path: string): any;
}