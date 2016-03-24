/**
 * Word Divider Collections
 */
export default {
  // Japanese and Chinese usually don't use word devider.
  '': [
    /^ja/,
    /^ojp$/,
    /^cn-/,
  ],

  // Other languages use a space as word devider.
  '\u0020': [
    /.*/,
  ],
};
