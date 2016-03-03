import assert from 'power-assert';

export async function assertOutput({ func, input, expect }) {
  const output = await func(input);

  assert(output === expect);
}
