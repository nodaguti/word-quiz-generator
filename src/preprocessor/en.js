export default function (text) {
  return text
    // Remove unnecessary line breaks.
    .replace(/[\n\r]+/g, ' ')

    // Remove soft hyphens.
    .replace(/(\w)-\s+(\w)/g, '$1$2')

    // Replace some full-width signs with their half-width ones.
    .replace(/’/g, '\'')
    .replace(/(?:“|”)/g, '"');
}
