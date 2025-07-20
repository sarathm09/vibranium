/**
 * Random data generators for testing scenarios
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export interface RandomGeneratorOptions {
  seed?: number;
  locale?: string;
}

export class RandomGenerators {
  private seed: number;
  private rng: () => number;

  constructor(options: RandomGeneratorOptions = {}) {
    this.seed = options.seed || Date.now();
    this.rng = this.createSeededRandom(this.seed);
  }

  /**
   * Generate UUID v4
   */
  uuid(): string {
    return uuidv4();
  }

  /**
   * Generate random string with custom pattern
   */
  string(length = 10, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(this.rng() * charset.length));
    }
    return result;
  }

  /**
   * Generate random alphanumeric string
   */
  alphanumeric(length = 10): string {
    return this.string(length, 'abcdefghijklmnopqrstuvwxyz0123456789');
  }

  /**
   * Generate random hex string
   */
  hex(length = 8): string {
    return this.string(length, '0123456789abcdef');
  }

  /**
   * Generate random number
   */
  number(min = 0, max = 100): number {
    return Math.floor(this.rng() * (max - min + 1)) + min;
  }

  /**
   * Generate random float
   */
  float(min = 0, max = 1, decimals = 2): number {
    const value = this.rng() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  /**
   * Generate random boolean
   */
  boolean(): boolean {
    return this.rng() >= 0.5;
  }

  /**
   * Generate random email
   */
  email(domain = 'example.com'): string {
    const username = this.string(8, 'abcdefghijklmnopqrstuvwxyz0123456789');
    return `${username}@${domain}`;
  }

  /**
   * Generate random URL
   */
  url(protocol = 'https', domain?: string): string {
    const randomDomain = domain || `${this.string(8, 'abcdefghijklmnopqrstuvwxyz')}.com`;
    const path = this.string(6, 'abcdefghijklmnopqrstuvwxyz');
    return `${protocol}://${randomDomain}/${path}`;
  }

  /**
   * Generate random phone number
   */
  phone(format = '###-###-####'): string {
    return format.replace(/#/g, () => this.number(0, 9).toString());
  }

  /**
   * Generate random date
   */
  date(start?: Date, end?: Date): Date {
    const startTime = start ? start.getTime() : new Date(2020, 0, 1).getTime();
    const endTime = end ? end.getTime() : Date.now();
    const randomTime = startTime + this.rng() * (endTime - startTime);
    return new Date(randomTime);
  }

  /**
   * Generate random date string in ISO format
   */
  dateString(start?: Date, end?: Date): string {
    return this.date(start, end).toISOString();
  }

  /**
   * Generate random time string
   */
  time(): string {
    const hours = this.number(0, 23).toString().padStart(2, '0');
    const minutes = this.number(0, 59).toString().padStart(2, '0');
    const seconds = this.number(0, 59).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Pick random item from array
   */
  fromArray<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    return items[Math.floor(this.rng() * items.length)];
  }

  /**
   * Pick multiple random items from array
   */
  fromArrayMultiple<T>(items: T[], count: number, unique = true): T[] {
    if (count > items.length && unique) {
      throw new Error('Cannot pick more unique items than available');
    }

    const result: T[] = [];
    const available = [...items];

    for (let i = 0; i < count; i++) {
      const index = Math.floor(this.rng() * available.length);
      const item = available[index];
      result.push(item);

      if (unique) {
        available.splice(index, 1);
      }
    }

    return result;
  }

  /**
   * Generate random color
   */
  color(): string {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', '#FF33F1', '#F1FF33',
      '#33FFF1', '#F133FF', '#57FF33', '#FF3357', '#5733FF'
    ];
    return this.fromArray(colors);
  }

  /**
   * Generate random RGB color
   */
  rgb(): string {
    const r = this.number(0, 255);
    const g = this.number(0, 255);
    const b = this.number(0, 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Generate random hex color
   */
  hexColor(): string {
    return `#${this.hex(6)}`;
  }

  /**
   * Generate random IP address
   */
  ipAddress(): string {
    const octets = Array.from({ length: 4 }, () => this.number(0, 255));
    return octets.join('.');
  }

  /**
   * Generate random MAC address
   */
  macAddress(): string {
    const bytes = Array.from({ length: 6 }, () => this.hex(2));
    return bytes.join(':');
  }

  /**
   * Generate random user agent string
   */
  userAgent(): string {
    const browsers = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0'
    ];
    return this.fromArray(browsers);
  }

  /**
   * Generate random credit card number (for testing only)
   */
  creditCard(): string {
    // Generate a valid-looking test credit card number (Luhn algorithm)
    const prefix = '4111111111111'; // Visa test prefix
    let number = prefix;
    
    // Add one more digit to make it 15 digits
    number += this.number(0, 9).toString();
    
    // Calculate Luhn check digit
    let sum = 0;
    let isEven = false;
    
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i]);
      
      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }
      
      sum += digit;
      isEven = !isEven;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return number + checkDigit.toString();
  }

  /**
   * Generate random password
   */
  password(length = 12, includeSymbols = true): string {
    let charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    if (includeSymbols) {
      charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    }
    return this.string(length, charset);
  }

  /**
   * Generate random coordinates (latitude, longitude)
   */
  coordinates(): { latitude: number; longitude: number } {
    return {
      latitude: this.float(-90, 90, 6),
      longitude: this.float(-180, 180, 6)
    };
  }

  /**
   * Generate random file extension
   */
  fileExtension(): string {
    const extensions = [
      'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
      'jpg', 'jpeg', 'png', 'gif', 'svg', 'bmp',
      'mp3', 'mp4', 'avi', 'mkv', 'wav',
      'zip', 'rar', '7z', 'tar', 'gz'
    ];
    return this.fromArray(extensions);
  }

  /**
   * Generate random filename
   */
  filename(): string {
    const name = this.string(8, 'abcdefghijklmnopqrstuvwxyz0123456789');
    const ext = this.fileExtension();
    return `${name}.${ext}`;
  }

  /**
   * Generate random JSON object
   */
  jsonObject(depth = 2, maxProperties = 5): any {
    if (depth <= 0) {
      return this.fromArray([
        this.string(),
        this.number(),
        this.boolean(),
        null
      ]);
    }

    const obj: any = {};
    const propertyCount = this.number(1, maxProperties);

    for (let i = 0; i < propertyCount; i++) {
      const key = this.string(5, 'abcdefghijklmnopqrstuvwxyz');
      const valueType = this.fromArray(['string', 'number', 'boolean', 'object', 'array', 'null']);

      switch (valueType) {
        case 'string':
          obj[key] = this.string();
          break;
        case 'number':
          obj[key] = this.number();
          break;
        case 'boolean':
          obj[key] = this.boolean();
          break;
        case 'object':
          obj[key] = this.jsonObject(depth - 1, Math.max(1, maxProperties - 1));
          break;
        case 'array':
          obj[key] = Array.from({ length: this.number(1, 3) }, () => this.string());
          break;
        case 'null':
          obj[key] = null;
          break;
      }
    }

    return obj;
  }

  /**
   * Create seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      return currentSeed / 233280;
    };
  }

  /**
   * Set new seed for reproducible results
   */
  setSeed(seed: number): void {
    this.seed = seed;
    this.rng = this.createSeededRandom(seed);
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.seed;
  }
}