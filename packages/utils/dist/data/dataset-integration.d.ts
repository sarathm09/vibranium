/**
 * Integration with test-datasets library for rich random data
 */
export interface DatasetConfig {
    locale?: string;
    seed?: number;
    categories?: string[];
}
export declare class DatasetIntegration {
    private config;
    private datasets;
    constructor(config?: DatasetConfig);
    /**
     * Get random name from Marvel dataset
     */
    getMarvelName(): string;
    /**
     * Get random Star Wars character name
     */
    getStarWarsName(): string;
    /**
     * Get random Harry Potter character name
     */
    getHarryPotterName(): string;
    /**
     * Get random first name
     */
    getFirstName(gender?: 'male' | 'female'): string;
    /**
     * Get random last name
     */
    getLastName(): string;
    /**
     * Get random full name
     */
    getFullName(gender?: 'male' | 'female'): string;
    /**
     * Get random company name
     */
    getCompanyName(): string;
    /**
     * Get random city name
     */
    getCityName(): string;
    /**
     * Get random country name
     */
    getCountryName(): string;
    /**
     * Get Lorem Ipsum word
     */
    getLoremWord(): string;
    /**
     * Get Lorem Ipsum words
     */
    getLoremWords(count?: number): string;
    /**
     * Get Lorem Ipsum sentence
     */
    getLoremSentence(): string;
    /**
     * Get Lorem Ipsum paragraph
     */
    getLoremParagraph(): string;
    /**
     * Get random job title
     */
    getJobTitle(): string;
    /**
     * Get random department
     */
    getDepartment(): string;
    /**
     * Get random programming language
     */
    getProgrammingLanguage(): string;
    /**
     * Get random framework
     */
    getFramework(): string;
    /**
     * Get random database name
     */
    getDatabase(): string;
    /**
     * Get custom dataset by name
     */
    getFromDataset(datasetName: string, property?: string): any;
    /**
     * Add custom dataset
     */
    addDataset(name: string, data: any): void;
    /**
     * Initialize built-in datasets
     */
    private initializeDatasets;
    /**
     * Get random item from array
     */
    private getRandomFromArray;
}
//# sourceMappingURL=dataset-integration.d.ts.map