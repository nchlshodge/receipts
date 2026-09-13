import type { Category } from '../types';
import { categoryInk, categoryTint } from '../lib/categories';

type Size = 'sm' | 'md' | 'chip';

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '4px 11px', fontSize: 11.5 },
  md: { padding: '8px 14px', fontSize: 13 },
  chip: { padding: '6px 10px', fontSize: 12.5 },
};

export function CategoryPill({
  category,
  size = 'sm',
  onClick,
  selected,
  style,
  children,
}: {
  category: Pick<Category, 'name' | 'hue'>;
  size?: Size;
  onClick?: () => void;
  selected?: boolean;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      onClick={onClick}
      className="pill"
      style={{
        background: categoryTint(category.hue),
        color: categoryInk(category.hue),
        outline: selected ? `1.5px solid ${categoryInk(category.hue)}` : undefined,
        outlineOffset: selected ? 1 : undefined,
        cursor: onClick ? 'pointer' : 'default',
        ...SIZE_STYLES[size],
        ...style,
      }}
    >
      {category.name}
      {children}
    </Tag>
  );
}
