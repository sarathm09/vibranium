export interface XPathParser {
  query(xml: string, xpath: string): any[];
  queryFirst(xml: string, xpath: string): any;
}