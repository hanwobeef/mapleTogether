export const TAG_OPTIONS = [
  { value: '본캐', label: '본캐', tone: 'main' },
  { value: '진심부캐', label: '진심부캐', tone: 'sub' },
  { value: '검밑솔', label: '검밑솔', tone: 'boss' }
];

export const TAG_VALUES = TAG_OPTIONS.map(option => option.value);

export function normalizeTagList(tags) {
  const rawTags = Array.isArray(tags)
    ? tags
    : typeof tags === 'string'
      ? tags.split(',')
      : [];

  return [...new Set(
    rawTags
      .map(tag => tag.toString().trim())
      .filter(tag => TAG_VALUES.includes(tag))
  )];
}

export function getTagTone(tag) {
  return TAG_OPTIONS.find(option => option.value === tag)?.tone || 'default';
}
