/**
 * Specific data type generators for common testing scenarios
 */

import { RandomGenerators } from './random-generators';

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

export class DataTypeGenerators {
  private randomGen: RandomGenerators;

  constructor(seed?: number) {
    this.randomGen = new RandomGenerators({ seed });
  }

  /**
   * Generate a complete person profile
   */
  generatePerson(): PersonData {
    const firstName = this.getFirstName();
    const lastName = this.getLastName();
    
    return {
      id: this.randomGen.uuid(),
      firstName,
      lastName,
      fullName: `${firstName} ${lastName}`,
      email: this.randomGen.email(),
      phone: this.randomGen.phone(),
      age: this.randomGen.number(18, 80),
      address: this.generateAddress(),
      company: this.generateCompany()
    };
  }

  /**
   * Generate address data
   */
  generateAddress(): AddressData {
    const states = [
      'CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
      'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI'
    ];

    const cities = [
      'Springfield', 'Franklin', 'Georgetown', 'Madison', 'Washington',
      'Arlington', 'Marion', 'Oxford', 'Harvard', 'Valley View'
    ];

    return {
      street: `${this.randomGen.number(1, 9999)} ${this.getStreetName()}`,
      city: this.randomGen.fromArray(cities),
      state: this.randomGen.fromArray(states),
      zipCode: this.randomGen.string(5, '0123456789'),
      country: 'United States'
    };
  }

  /**
   * Generate company data
   */
  generateCompany(): CompanyData {
    const industries = [
      'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
      'Manufacturing', 'Entertainment', 'Transportation', 'Energy', 'Agriculture'
    ];

    const departments = [
      'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations',
      'Customer Service', 'Research', 'Design', 'Legal'
    ];

    const jobTitles = [
      'Software Engineer', 'Product Manager', 'Sales Representative', 'Analyst',
      'Coordinator', 'Specialist', 'Director', 'Manager', 'Executive', 'Consultant'
    ];

    const companyName = this.getCompanyName();

    return {
      name: companyName,
      industry: this.randomGen.fromArray(industries),
      department: this.randomGen.fromArray(departments),
      jobTitle: this.randomGen.fromArray(jobTitles),
      website: `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`
    };
  }

  /**
   * Generate financial data
   */
  generateFinancialData(): FinancialData {
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY'];

    return {
      accountNumber: this.randomGen.string(10, '0123456789'),
      routingNumber: this.randomGen.string(9, '0123456789'),
      creditCard: this.randomGen.creditCard(),
      iban: `GB${this.randomGen.string(2, '0123456789')}ABCD${this.randomGen.string(14, '0123456789')}`,
      bic: this.randomGen.string(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
      currency: this.randomGen.fromArray(currencies),
      amount: this.randomGen.float(1, 10000, 2)
    };
  }

  /**
   * Generate device/browser data
   */
  generateDevice(): DeviceData {
    const deviceTypes: Array<'mobile' | 'desktop' | 'tablet'> = ['mobile', 'desktop', 'tablet'];
    const deviceType = this.randomGen.fromArray(deviceTypes);

    const osMap = {
      mobile: ['iOS', 'Android'],
      desktop: ['Windows', 'macOS', 'Linux'],
      tablet: ['iOS', 'Android', 'Windows']
    };

    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
    const resolutions = ['1920x1080', '1366x768', '1440x900', '1024x768', '414x896', '375x667'];

    return {
      id: this.randomGen.uuid(),
      type: deviceType,
      os: this.randomGen.fromArray(osMap[deviceType]),
      browser: this.randomGen.fromArray(browsers),
      userAgent: this.randomGen.userAgent(),
      screenResolution: this.randomGen.fromArray(resolutions),
      ipAddress: this.randomGen.ipAddress(),
      macAddress: this.randomGen.macAddress()
    };
  }

  /**
   * Generate product data
   */
  generateProduct(): ProductData {
    const categories = [
      'Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books',
      'Automotive', 'Health & Beauty', 'Toys', 'Jewelry', 'Tools'
    ];

    const adjectives = ['Premium', 'Deluxe', 'Classic', 'Modern', 'Vintage', 'Pro', 'Ultra'];
    const nouns = ['Widget', 'Gadget', 'Device', 'Tool', 'Kit', 'Set', 'System'];

    const productName = `${this.randomGen.fromArray(adjectives)} ${this.randomGen.fromArray(nouns)}`;

    return {
      id: this.randomGen.uuid(),
      name: productName,
      description: `High-quality ${productName.toLowerCase()} for everyday use.`,
      category: this.randomGen.fromArray(categories),
      price: this.randomGen.float(9.99, 999.99, 2),
      currency: 'USD',
      sku: this.randomGen.string(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'),
      weight: this.randomGen.float(0.1, 10.0, 2),
      dimensions: {
        length: this.randomGen.float(1, 50, 1),
        width: this.randomGen.float(1, 50, 1),
        height: this.randomGen.float(1, 50, 1)
      },
      tags: this.randomGen.fromArrayMultiple(
        ['popular', 'new', 'sale', 'featured', 'bestseller', 'limited'],
        this.randomGen.number(1, 3)
      )
    };
  }

  /**
   * Generate API response data
   */
  generateApiResponse(status: 'success' | 'error' = 'success'): any {
    if (status === 'error') {
      return {
        success: false,
        error: {
          code: this.randomGen.fromArray(['400', '401', '403', '404', '500']),
          message: this.randomGen.fromArray([
            'Bad Request',
            'Unauthorized',
            'Forbidden',
            'Not Found',
            'Internal Server Error'
          ]),
          timestamp: new Date().toISOString()
        }
      };
    }

    return {
      success: true,
      data: this.randomGen.jsonObject(2, 5),
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: this.randomGen.uuid(),
        version: '1.0.0'
      }
    };
  }

  /**
   * Generate test credentials
   */
  generateCredentials(): { username: string; password: string; token?: string } {
    return {
      username: `user_${this.randomGen.alphanumeric(8)}`,
      password: this.randomGen.password(12),
      token: this.randomGen.string(32, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
    };
  }

  /**
   * Generate test database record
   */
  generateDatabaseRecord(tableName: string): any {
    const baseRecord = {
      id: this.randomGen.uuid(),
      created_at: this.randomGen.dateString(),
      updated_at: this.randomGen.dateString(),
      version: this.randomGen.number(1, 10)
    };

    // Add table-specific fields based on table name
    switch (tableName.toLowerCase()) {
      case 'users':
        return {
          ...baseRecord,
          ...this.generatePerson(),
          status: this.randomGen.fromArray(['active', 'inactive', 'pending'])
        };
      case 'products':
        return {
          ...baseRecord,
          ...this.generateProduct()
        };
      case 'orders':
        return {
          ...baseRecord,
          user_id: this.randomGen.uuid(),
          total: this.randomGen.float(10, 1000, 2),
          status: this.randomGen.fromArray(['pending', 'processing', 'shipped', 'delivered'])
        };
      default:
        return {
          ...baseRecord,
          data: this.randomGen.jsonObject(1, 3)
        };
    }
  }

  /**
   * Helper methods
   */
  private getFirstName(): string {
    const names = [
      'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
      'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'
    ];
    return this.randomGen.fromArray(names);
  }

  private getLastName(): string {
    const names = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
      'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'
    ];
    return this.randomGen.fromArray(names);
  }

  private getStreetName(): string {
    const streetTypes = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Way', 'Ct'];
    const streetNames = [
      'Main', 'First', 'Second', 'Park', 'Oak', 'Pine', 'Maple', 'Cedar',
      'Elm', 'Washington', 'Lake', 'Hill', 'Church', 'School', 'Spring', 'State'
    ];
    
    return `${this.randomGen.fromArray(streetNames)} ${this.randomGen.fromArray(streetTypes)}`;
  }

  private getCompanyName(): string {
    const prefixes = ['Global', 'Tech', 'Digital', 'Smart', 'Advanced'];
    const roots = ['Solutions', 'Systems', 'Technologies', 'Corp', 'Industries'];
    const suffixes = ['Inc', 'LLC', 'Ltd'];

    return `${this.randomGen.fromArray(prefixes)} ${this.randomGen.fromArray(roots)} ${this.randomGen.fromArray(suffixes)}`;
  }
}