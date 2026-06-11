const SPECIAL: Record<string, string> = {
  'mr-mime': 'Mr. Mime',
  'mime-jr': 'Mime Jr.',
  'mr-rime': 'Mr. Rime',
  farfetchd: "Farfetch'd",
  sirfetchd: "Sirfetch'd",
  'nidoran-f': 'Nidoran♀',
  'nidoran-m': 'Nidoran♂',
  'ho-oh': 'Ho-Oh',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** PokéAPI lowercase slug → display name (`mr-mime` → "Mr. Mime"). */
export function formatName(slug: string): string {
  return SPECIAL[slug] ?? slug.split('-').map(capitalize).join(' ');
}
