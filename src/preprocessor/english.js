export default function (text) {
  return text
    // Remove unnecessary line breaks.
    .replace(/([^\d])[\n\r]/g, '$1 ')

    // Remove soft hyphens.
    .replace(/(\w)- (\w)/g, '$1$2')

    // Replace some full-width signs with their half-width ones.
    .replace(/’/g, '\'')
    .replace(/(?:“|”)/g, '"');
}
