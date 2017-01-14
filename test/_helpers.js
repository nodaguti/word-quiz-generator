import assert from 'assert';

// We intentionally use named export here because this file provides helper
// funtions, which means we expect more methods will be added in the future.
// eslint-disable-next-line import/prefer-default-export
export async function assertOutput({ func, input, expected }) {
  const output = await func(input);

  assert(input && (output === expected));
}
