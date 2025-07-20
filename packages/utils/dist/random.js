/**
 * @deprecated Use ./data exports instead
 * Random data generation utilities - Legacy compatibility
 */
import { RandomGenerators } from './data';
/**
 * @deprecated Use RandomGenerators from ./data instead
 */
export class RandomHelper {
    generator = new RandomGenerators();
    uuid() {
        return this.generator.uuid();
    }
    randomString(length = 10) {
        return this.generator.string(length);
    }
    randomNumber(min = 0, max = 100) {
        return this.generator.number(min, max);
    }
    randomBoolean() {
        return this.generator.boolean();
    }
    randomEmail() {
        return this.generator.email();
    }
    randomName() {
        // Use dataset integration for better names
        return 'Random Name'; // Simplified for compatibility
    }
    randomDate(start, end) {
        return this.generator.date(start, end);
    }
    randomFromArray(items) {
        return this.generator.fromArray(items);
    }
}
//# sourceMappingURL=random.js.map