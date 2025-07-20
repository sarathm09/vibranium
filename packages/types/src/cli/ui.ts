/**
 * UI types
 */

export interface UIState {
  currentView: string;
  data: Record<string, any>;
}

export interface UIComponent {
  render(): string;
  handleInput(input: string): void;
}