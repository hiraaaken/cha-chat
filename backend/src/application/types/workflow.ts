import type { Result } from 'neverthrow';

export type Workflow<I, O, E> = (input: I) => Promise<Result<O, E>>;
