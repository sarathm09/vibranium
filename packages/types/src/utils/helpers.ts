export interface UtilityFunction {
  name: string;
  implementation: (...args: any[]) => any;
}

export interface AsyncUtilityFunction {
  name: string;
  implementation: (...args: any[]) => Promise<any>;
}