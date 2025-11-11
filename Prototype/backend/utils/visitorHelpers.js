const normalize = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return String(value).trim();
  return value.trim();
};

const lower = (value) => normalize(value).toLowerCase();

const isFieldMissing = (value) => {
  const normalized = lower(value);
  return (
    normalized === '' ||
    normalized === 'not provided' ||
    normalized === 'not specified' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'none' ||
    normalized === 'unknown' ||
    normalized === 'null' ||
    normalized === 'undefined'
  );
};

const hasPlaceholderName = (firstName, lastName) => {
  const fn = lower(firstName);
  const ln = lower(lastName);
  const full = `${fn} ${ln}`.trim();
  if (!fn && !ln) return true;
  const placeholderNames = ['walk-in visitor', 'visitor', 'group leader', 'group visitor', 'additional visitor'];
  return placeholderNames.includes(full) || placeholderNames.includes(fn) || placeholderNames.includes(ln);
};

module.exports = {
  normalize,
  isFieldMissing,
  hasPlaceholderName
};
