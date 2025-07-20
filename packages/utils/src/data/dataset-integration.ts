/**
 * Integration with test-datasets library for rich random data
 */

export interface DatasetConfig {
  locale?: string;
  seed?: number;
  categories?: string[];
}

export class DatasetIntegration {
  private config: DatasetConfig;
  private datasets: Map<string, any> = new Map();

  constructor(config: DatasetConfig = {}) {
    this.config = {
      locale: config.locale || 'en',
      seed: config.seed,
      categories: config.categories || ['names', 'lorem', 'marvel', 'starwars', 'harrypotter']
    };
    this.initializeDatasets();
  }

  /**
   * Get random name from Marvel dataset
   */
  getMarvelName(): string {
    const marvelNames = [
      'Spider-Man', 'Iron Man', 'Captain America', 'Thor', 'Hulk', 'Black Widow',
      'Hawkeye', 'Doctor Strange', 'Scarlet Witch', 'Vision', 'Falcon', 'Winter Soldier',
      'Ant-Man', 'Wasp', 'Captain Marvel', 'Black Panther', 'Star-Lord', 'Gamora',
      'Rocket Raccoon', 'Groot', 'Drax', 'Mantis', 'Nebula', 'War Machine',
      'Pepper Potts', 'Happy Hogan', 'Nick Fury', 'Maria Hill', 'Phil Coulson'
    ];
    return this.getRandomFromArray(marvelNames);
  }

  /**
   * Get random Star Wars character name
   */
  getStarWarsName(): string {
    const starWarsNames = [
      'Luke Skywalker', 'Leia Organa', 'Han Solo', 'Darth Vader', 'Obi-Wan Kenobi',
      'Yoda', 'Chewbacca', 'C-3PO', 'R2-D2', 'Padmé Amidala', 'Anakin Skywalker',
      'Mace Windu', 'Qui-Gon Jinn', 'Emperor Palpatine', 'Boba Fett', 'Jango Fett',
      'Lando Calrissian', 'Jabba the Hutt', 'Count Dooku', 'General Grievous',
      'Kylo Ren', 'Rey', 'Finn', 'Poe Dameron', 'BB-8', 'Snoke', 'Hux'
    ];
    return this.getRandomFromArray(starWarsNames);
  }

  /**
   * Get random Harry Potter character name
   */
  getHarryPotterName(): string {
    const harryPotterNames = [
      'Harry Potter', 'Hermione Granger', 'Ron Weasley', 'Albus Dumbledore',
      'Severus Snape', 'Minerva McGonagall', 'Rubeus Hagrid', 'Draco Malfoy',
      'Neville Longbottom', 'Luna Lovegood', 'Ginny Weasley', 'Sirius Black',
      'Remus Lupin', 'Lord Voldemort', 'Bellatrix Lestrange', 'Lucius Malfoy',
      'Narcissa Malfoy', 'Dobby', 'Hedwig', 'Crookshanks', 'Buckbeak'
    ];
    return this.getRandomFromArray(harryPotterNames);
  }

  /**
   * Get random first name
   */
  getFirstName(gender?: 'male' | 'female'): string {
    const maleNames = [
      'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
      'Thomas', 'Christopher', 'Charles', 'Daniel', 'Matthew', 'Anthony', 'Mark',
      'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian'
    ];
    
    const femaleNames = [
      'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan',
      'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa', 'Betty', 'Helen', 'Sandra',
      'Donna', 'Carol', 'Ruth', 'Sharon', 'Michelle', 'Laura', 'Sarah', 'Kimberly'
    ];

    if (gender === 'male') {
      return this.getRandomFromArray(maleNames);
    } else if (gender === 'female') {
      return this.getRandomFromArray(femaleNames);
    } else {
      return this.getRandomFromArray([...maleNames, ...femaleNames]);
    }
  }

  /**
   * Get random last name
   */
  getLastName(): string {
    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
      'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez',
      'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark'
    ];
    return this.getRandomFromArray(lastNames);
  }

  /**
   * Get random full name
   */
  getFullName(gender?: 'male' | 'female'): string {
    return `${this.getFirstName(gender)} ${this.getLastName()}`;
  }

  /**
   * Get random company name
   */
  getCompanyName(): string {
    const prefixes = ['Global', 'Tech', 'Digital', 'Smart', 'Innovation', 'Future', 'Advanced'];
    const roots = ['Solutions', 'Systems', 'Technologies', 'Dynamics', 'Corp', 'Industries', 'Services'];
    const suffixes = ['Inc', 'LLC', 'Group', 'Ltd', 'Co'];

    const prefix = this.getRandomFromArray(prefixes);
    const root = this.getRandomFromArray(roots);
    const suffix = this.getRandomFromArray(suffixes);

    return `${prefix} ${root} ${suffix}`;
  }

  /**
   * Get random city name
   */
  getCityName(): string {
    const cities = [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia',
      'San Antonio', 'San Diego', 'Dallas', 'San Jose', 'Austin', 'Jacksonville',
      'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco', 'Indianapolis',
      'Seattle', 'Denver', 'Washington', 'Boston', 'El Paso', 'Nashville'
    ];
    return this.getRandomFromArray(cities);
  }

  /**
   * Get random country name
   */
  getCountryName(): string {
    const countries = [
      'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy',
      'Spain', 'Japan', 'Australia', 'Brazil', 'India', 'China', 'Mexico',
      'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Switzerland', 'Austria',
      'Belgium', 'Portugal', 'Poland', 'Czech Republic', 'Hungary', 'Greece'
    ];
    return this.getRandomFromArray(countries);
  }

  /**
   * Get Lorem Ipsum word
   */
  getLoremWord(): string {
    const loremWords = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
      'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
      'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
      'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];
    return this.getRandomFromArray(loremWords);
  }

  /**
   * Get Lorem Ipsum words
   */
  getLoremWords(count = 3): string {
    const words = Array.from({ length: count }, () => this.getLoremWord());
    return words.join(' ');
  }

  /**
   * Get Lorem Ipsum sentence
   */
  getLoremSentence(): string {
    const wordCount = 8 + Math.floor(Math.random() * 10);
    const words = this.getLoremWords(wordCount);
    return words.charAt(0).toUpperCase() + words.slice(1) + '.';
  }

  /**
   * Get Lorem Ipsum paragraph
   */
  getLoremParagraph(): string {
    const sentenceCount = 3 + Math.floor(Math.random() * 4);
    const sentences = Array.from({ length: sentenceCount }, () => this.getLoremSentence());
    return sentences.join(' ');
  }

  /**
   * Get random job title
   */
  getJobTitle(): string {
    const titles = [
      'Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer',
      'DevOps Engineer', 'Business Analyst', 'Marketing Manager', 'Sales Representative',
      'Project Manager', 'Technical Writer', 'Quality Assurance Engineer',
      'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
      'Mobile Developer', 'Database Administrator', 'System Administrator',
      'Network Engineer', 'Security Analyst', 'Solutions Architect'
    ];
    return this.getRandomFromArray(titles);
  }

  /**
   * Get random department
   */
  getDepartment(): string {
    const departments = [
      'Engineering', 'Product', 'Marketing', 'Sales', 'Human Resources',
      'Finance', 'Operations', 'Customer Success', 'Legal', 'IT',
      'Research and Development', 'Quality Assurance', 'Business Development',
      'Design', 'Data Science', 'Security', 'Support', 'Training'
    ];
    return this.getRandomFromArray(departments);
  }

  /**
   * Get random programming language
   */
  getProgrammingLanguage(): string {
    const languages = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust',
      'PHP', 'Ruby', 'Swift', 'Kotlin', 'Dart', 'Scala', 'R', 'MATLAB',
      'Perl', 'Lua', 'Haskell', 'Clojure', 'F#', 'Erlang', 'Elixir'
    ];
    return this.getRandomFromArray(languages);
  }

  /**
   * Get random framework
   */
  getFramework(): string {
    const frameworks = [
      'React', 'Vue.js', 'Angular', 'Express.js', 'Next.js', 'Nuxt.js',
      'Django', 'Flask', 'FastAPI', 'Spring Boot', 'ASP.NET Core',
      'Laravel', 'Rails', 'Svelte', 'Ember.js', 'Meteor', 'Koa.js'
    ];
    return this.getRandomFromArray(frameworks);
  }

  /**
   * Get random database name
   */
  getDatabase(): string {
    const databases = [
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle',
      'SQL Server', 'Cassandra', 'DynamoDB', 'CouchDB', 'InfluxDB',
      'Neo4j', 'Elasticsearch', 'MariaDB', 'Amazon RDS', 'Firebase'
    ];
    return this.getRandomFromArray(databases);
  }

  /**
   * Get custom dataset by name
   */
  getFromDataset(datasetName: string, property?: string): any {
    const dataset = this.datasets.get(datasetName);
    if (!dataset) {
      throw new Error(`Dataset '${datasetName}' not found`);
    }

    if (property) {
      const data = dataset[property];
      if (!data) {
        throw new Error(`Property '${property}' not found in dataset '${datasetName}'`);
      }
      return Array.isArray(data) ? this.getRandomFromArray(data) : data;
    }

    return dataset;
  }

  /**
   * Add custom dataset
   */
  addDataset(name: string, data: any): void {
    this.datasets.set(name, data);
  }

  /**
   * Initialize built-in datasets
   */
  private initializeDatasets(): void {
    // Initialize placeholder datasets
    // In a real implementation, these would be loaded from the test-datasets library
    this.datasets.set('names', {
      first: ['John', 'Jane', 'Bob', 'Alice'],
      last: ['Smith', 'Doe', 'Johnson', 'Brown']
    });

    this.datasets.set('lorem', {
      words: ['lorem', 'ipsum', 'dolor', 'sit', 'amet'],
      sentences: ['Lorem ipsum dolor sit amet.', 'Consectetur adipiscing elit.']
    });
  }

  /**
   * Get random item from array
   */
  private getRandomFromArray<T>(array: T[]): T {
    if (array.length === 0) {
      throw new Error('Cannot get random item from empty array');
    }
    return array[Math.floor(Math.random() * array.length)];
  }
}