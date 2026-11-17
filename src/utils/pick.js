// Devuelve un objeto solo con las claves permitidas (evita mass-assignment).
module.exports = (source, allowed) => {
  const result = {};
  if (!source || typeof source !== 'object' || Array.isArray(source)) return result;
  for (const key of allowed) {
    if (source[key] !== undefined) result[key] = source[key];
  }
  return result;
};
