export interface BinaryParser {
  parse(buffer: Buffer): any;
  extract(buffer: Buffer, offset: number, length: number): Buffer;
}