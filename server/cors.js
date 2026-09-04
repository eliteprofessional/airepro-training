function parseCorsOrigin(value) {
  if (value == null || value === '') return true;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const list = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (list.length === 0) return false;
  if (list.length === 1) return list[0];
  return list;
}

export function createCorsOptions() {
  const origin = parseCorsOrigin(process.env.CORS_ORIGIN);
  return {
    origin,
    credentials: true,
  };
}
