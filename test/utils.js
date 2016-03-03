import assert from 'power-assert';

export async function assertOutput({ func, input, expected }) {
  const output = await func(input);

  assert(output === expected);
}
