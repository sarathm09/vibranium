/**
 * Assertion engine - placeholder for future implementation
 */
export interface AssertionResult {
    passed: boolean;
    message: string;
    operator: string;
    expected: any;
    actual: any;
}
export declare class AssertionEngine {
    assert(operator: string, expected: any, actual: any): Promise<AssertionResult>;
}
//# sourceMappingURL=assertion-engine.d.ts.map