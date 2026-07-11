/**
 * Icon Resolver — curated icon lookup for itinerary categories and UI actions.
 *
 * Replaces `import * as LucideIcons` with a finite, hand-picked map so
 * tree-shaking works properly and the bundle stays lean.
 */

import {
  Landmark,
  Utensils,
  TreePine,
  ShoppingBag,
  Train,
  Hotel,
  Mountain,
  Martini,
  Coffee,
  MapPin,
  Check,
  GripVertical,
  Info,
  Trash2,
  BarChart3,
  CheckSquare,
  Lightbulb,
  Bookmark,
  FileText,
} from "lucide-react";

// Category icons — maps category key → React component
const CATEGORY_ICONS = {
  Landmark,
  Utensils,
  TreePine,
  ShoppingBag,
  Train,
  Hotel,
  Mountain,
  Martini,
  Coffee,
  MapPin,
};

// Block-type icons used by BlockCard
const BLOCK_ICONS = {
  BarChart3,
  CheckSquare,
  Lightbulb,
  Bookmark,
  FileText,
};

// Action icons used inside StopCard
export { Check, GripVertical, Info, Trash2 };

/**
 * Resolve an icon name (from CATEGORIES[cat].iconName) to a React component.
 * Falls back to MapPin for unknown names.
 */
export function resolveIcon(iconName) {
  return CATEGORY_ICONS[iconName] || BLOCK_ICONS[iconName] || MapPin;
}

/**
 * Resolve a block-type icon name to a React component.
 * Falls back to FileText for unknown block types.
 */
export function resolveBlockIcon(iconName) {
  return BLOCK_ICONS[iconName] || CATEGORY_ICONS[iconName] || FileText;
}
