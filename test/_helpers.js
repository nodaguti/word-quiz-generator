import assert from 'power-assert';

export async function assertOutput({ func, input, expected }) {
  const output = await func(input);

  // To display the input in the power-assert message
  assert(input && (output === expected));
}
