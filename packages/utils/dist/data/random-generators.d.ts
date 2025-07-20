/**
 * Random data generators for testing scenarios
 */
export interface RandomGeneratorOptions {
    seed?: number;
    locale?: string;
}
export declare class RandomGenerators {
    private seed;
    private rng;
    constructor(options?: RandomGeneratorOptions);
    /**
     * Generate UUID v4
     */
    uuid(): string;
    /**
     * Generate random string with custom pattern
     */
    string(length?: number, charset?: string): string;
    /**
     * Generate random alphanumeric string
     */
    alphanumeric(length?: number): string;
    /**
     * Generate random hex string
     */
    hex(length?: number): string;
    /**
     * Generate random number
     */
    number(min?: number, max?: number): number;
    /**
     * Generate random float
     */
    float(min?: number, max?: number, decimals?: number): number;
    /**
     * Generate random boolean
     */
    boolean(): boolean;
    /**
     * Generate random email
     */
    email(domain?: string): string;
    /**
     * Generate random URL
     */
    url(protocol?: string, domain?: string): string;
    /**
     * Generate random phone number
     */
    phone(format?: string): string;
    /**
     * Generate random date
     */
    date(start?: Date, end?: Date): Date;
    /**
     * Generate random date string in ISO format
     */
    dateString(start?: Date, end?: Date): string;
    /**
     * Generate random time string
     */
    time(): string;
    /**
     * Pick random item from array
     */
    fromArray<T>(items: T[]): T;
    /**
     * Pick multiple random items from array
     */
    fromArrayMultiple<T>(items: T[], count: number, unique?: boolean): T[];
    /**
     * Generate random color
     */
    color(): string;
    /**
     * Generate random RGB color
     */
    rgb(): string;
    /**
     * Generate random hex color
     */
    hexColor(): string;
    /**
     * Generate random IP address
     */
    ipAddress(): string;
    /**
     * Generate random MAC address
     */
    macAddress(): string;
    /**
     * Generate random user agent string
     */
    userAgent(): string;
    /**
     * Generate random credit card number (for testing only)
     */
    creditCard(): string;
    /**
     * Generate random password
     */
    password(length?: number, includeSymbols?: boolean): string;
    /**
     * Generate random coordinates (latitude, longitude)
     */
    coordinates(): {
        latitude: number;
        longitude: number;
    };
    /**
     * Generate random file extension
     */
    fileExtension(): string;
    /**
     * Generate random filename
     */
    filename(): string;
    /**
     * Generate random JSON object
     */
    jsonObject(depth?: number, maxProperties?: number): any;
    /**
     * Create seeded random number generator
     */
    private createSeededRandom;
    /**
     * Set new seed for reproducible results
     */
    setSeed(seed: number): void;
    /**
     * Get current seed
     */
    getSeed(): number;
}
//# sourceMappingURL=random-generators.d.ts.map