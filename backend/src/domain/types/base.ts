declare const brand: unique symbol;
export type Newtype<K extends string, T> = T & { [brand]: K };

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
