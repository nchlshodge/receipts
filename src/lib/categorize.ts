import type { Category } from '../types';

type Rule = { category: string; keywords: string[] };

// Free, local, rule-based categorizer — no AI call needed.
// Matches merchant name + item text against keyword lists per church budget category.
const RULES: Rule[] = [
  {
    category: 'Facilities & Maintenance',
    keywords: [
      'home depot', 'lowe', 'ace hardware', 'hardware', 'lumber', 'paint', 'plumbing',
      'hvac', 'air filter', 'light bulb', 'bulb', 'screws', 'drill', 'ladder', 'mop',
      'broom', 'cleaning supply', 'pest control', 'locksmith', 'fertilizer', 'mulch',
    ],
  },
  {
    category: 'Utilities',
    keywords: [
      'electric', 'power co', 'water dept', 'gas company', 'sewer', 'utility',
      'internet', 'wifi bill', 'verizon', 'at&t', 'att bill', 'comcast', 'spectrum',
      'xfinity', 'trash service', 'waste management',
    ],
  },
  {
    category: 'Office Supplies',
    keywords: [
      'office depot', 'staples', 'toner', 'ink cartridge', 'printer paper', 'envelope',
      'folder', 'stapler', 'copier', 'office supply', 'notebook', 'pens',
    ],
  },
  {
    category: 'Worship & Music',
    keywords: [
      'candle', 'bulletin', 'sheet music', 'guitar string', 'microphone', 'sound system',
      'communion', 'grape juice', 'hymnal', 'worship', 'instrument', 'amplifier', 'xlr cable',
    ],
  },
  {
    category: "Children's Ministry",
    keywords: [
      'sunday school', 'craft supply', 'coloring', 'nursery', 'diaper', 'kids curriculum',
      'children', 'vbs', 'vacation bible school',
    ],
  },
  {
    category: 'Youth Ministry',
    keywords: ['youth group', 'lock-in', 'youth camp', 'youth retreat', 'student ministry', 'youth event'],
  },
  {
    category: 'Outreach & Benevolence',
    keywords: [
      'gift card', 'benevolence', 'food pantry', 'shelter', 'outreach', 'backpack drive',
      'mission trip', 'donation',
    ],
  },
  {
    category: 'Hospitality & Food',
    keywords: [
      'coffee', 'donut', 'bagel', 'catering', 'potluck', 'fellowship', 'bakery', 'pizza',
      'grocery', 'market', 'food', 'snack', 'plates', 'napkin', 'cup', 'kitchen', 'deli',
    ],
  },
  {
    category: 'Technology',
    keywords: [
      'laptop', 'computer', 'software', 'subscription', 'zoom', 'projector', 'hdmi',
      'usb', 'batteries', 'camera', 'tablet', 'ipad',
    ],
  },
];

export function categorize(itemName: string, merchant: string, categories: Category[]): string {
  const haystack = `${merchant} ${itemName}`.toLowerCase();
  for (const rule of RULES) {
    if (!categories.some((c) => c.name === rule.category)) continue;
    if (rule.keywords.some((k) => haystack.includes(k))) return rule.category;
  }
  const other = categories.find((c) => c.name === 'Other');
  return other ? other.name : (categories[categories.length - 1]?.name ?? 'Other');
}
