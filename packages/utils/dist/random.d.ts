/**
 * @deprecated Use ./data exports instead
 * Random data generation utilities - Legacy compatibility
 */
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
export declare class RandomHelper implements RandomDataGenerator {
    private generator;
    uuid(): string;
    randomString(length?: number): string;
    randomNumber(min?: number, max?: number): number;
    randomBoolean(): boolean;
    randomEmail(): string;
    randomName(): string;
    randomDate(start?: Date, end?: Date): Date;
    randomFromArray<T>(items: T[]): T;
}
//# sourceMappingURL=random.d.ts.map