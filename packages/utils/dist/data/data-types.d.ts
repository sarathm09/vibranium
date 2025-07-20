/**
 * Specific data type generators for common testing scenarios
 */
export interface PersonData {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string;
    age: number;
    address: AddressData;
    company: CompanyData;
}
export interface AddressData {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}
export interface CompanyData {
    name: string;
    industry: string;
    department: string;
    jobTitle: string;
    website: string;
}
export interface FinancialData {
    accountNumber: string;
    routingNumber: string;
    creditCard: string;
    iban: string;
    bic: string;
    currency: string;
    amount: number;
}
export interface DeviceData {
    id: string;
    type: 'mobile' | 'desktop' | 'tablet';
    os: string;
    browser: string;
    userAgent: string;
    screenResolution: string;
    ipAddress: string;
    macAddress: string;
}
export interface ProductData {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    currency: string;
    sku: string;
    weight: number;
    dimensions: {
        length: number;
        width: number;
        height: number;
    };
    tags: string[];
}
export declare class DataTypeGenerators {
    private randomGen;
    constructor(seed?: number);
    /**
     * Generate a complete person profile
     */
    generatePerson(): PersonData;
    /**
     * Generate address data
     */
    generateAddress(): AddressData;
    /**
     * Generate company data
     */
    generateCompany(): CompanyData;
    /**
     * Generate financial data
     */
    generateFinancialData(): FinancialData;
    /**
     * Generate device/browser data
     */
    generateDevice(): DeviceData;
    /**
     * Generate product data
     */
    generateProduct(): ProductData;
    /**
     * Generate API response data
     */
    generateApiResponse(status?: 'success' | 'error'): any;
    /**
     * Generate test credentials
     */
    generateCredentials(): {
        username: string;
        password: string;
        token?: string;
    };
    /**
     * Generate test database record
     */
    generateDatabaseRecord(tableName: string): any;
    /**
     * Helper methods
     */
    private getFirstName;
    private getLastName;
    private getStreetName;
    private getCompanyName;
}
//# sourceMappingURL=data-types.d.ts.map