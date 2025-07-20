/**
 * @deprecated Use ./data exports instead
 * Random data generation utilities - Legacy compatibility
 */

import { RandomGenerators } from './data';

export interface RandomDataGenerator {
  uuid(): string;
  randomString(length?: number): string;
  randomNumber(min?: number, max?: number): number;
  randomBoolean(): boolean;
  randomEmail(): string;
  randomName(): string;
  randomDate(start?: Date, end?: Date): Date;
  randomFromArray<T>(items: T[]): T;
}

/**
 * @deprecated Use RandomGenerators from ./data instead
 */
export class RandomHelper implements RandomDataGenerator {
  private generator = new RandomGenerators();

  uuid(): string {
    return this.generator.uuid();
  }

  randomString(length: number = 10): string {
    return this.generator.string(length);
  }

  randomNumber(min: number = 0, max: number = 100): number {
    return this.generator.number(min, max);
  }

  randomBoolean(): boolean {
    return this.generator.boolean();
  }

  randomEmail(): string {
    return this.generator.email();
  }

  randomName(): string {
    // Use dataset integration for better names
    return 'Random Name'; // Simplified for compatibility
  }

  randomDate(start?: Date, end?: Date): Date {
    return this.generator.date(start, end);
  }

  randomFromArray<T>(items: T[]): T {
    return this.generator.fromArray(items);
  }
}