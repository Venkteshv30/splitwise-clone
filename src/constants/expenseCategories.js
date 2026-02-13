/**
 * Shared expense categories and keyword rules for deriving category from description.
 * Used by ChartsPage (pie chart, etc.) and TransactionsTab (icons).
 *
 * Order matters: first matching category wins. More specific keywords should
 * appear in earlier categories.
 */

// Category definitions: label, keywords (lowercase), and icon name for UI
export const EXPENSE_CATEGORIES = [
  {
    id: "food_dining",
    label: "Food & Dining",
    icon: "UtensilsCrossed",
    keywords: [
      "food",
      "dinner",
      "lunch",
      "breakfast",
      "bf ",
      " bf",
      "restaurant",
      "cafe",
      "coffee",
      "snacks",
      "ice cream",
      "cake",
      "butter milk",
      "buttermilk",
      "fruits",
      "water",
      "paaksala",
      "paakashala",
      "machilli",
      "pabbas",
      "giri manjas",
      "dharmasala",
      "dharmastala",
    ],
  },
  {
    id: "transport",
    label: "Transport",
    icon: "Car",
    keywords: [
      "petrol",
      "fuel",
      "gas",
      "toll",
      "cab",
      "uber",
      "taxi",
      "transport",
      "parking",
      "ford petrol",
      "petrol expense",
    ],
  },
  {
    id: "entertainment",
    label: "Entertainment",
    icon: "Film",
    keywords: [
      "movie",
      "entertainment",
      "banana ride",
      "jet ski",
      "jet skie",
      "speed boating",
      "bumper ride",
      "ride",
      "entry ticket",
      "ticket",
      "mall entry",
      "beach entrance",
    ],
  },
  {
    id: "shopping",
    label: "Shopping",
    icon: "ShoppingCart",
    keywords: ["grocery", "shopping", "mall", "beach - shopping", "sunscreen"],
  },
  {
    id: "accommodation",
    label: "Accommodation",
    icon: "Building",
    keywords: [
      "hotel",
      "accommodation",
      "villa",
      "booking",
      "treeboo",
      "treebo",
    ],
  },
];

// Fallback category when no keyword matches
export const DEFAULT_CATEGORY = {
  id: "other",
  label: "Other",
  icon: "Receipt",
};

/**
 * Get category object from expense description (keyword-based).
 * @param {string} description - Expense description
 * @returns {{ id: string, label: string, icon: string }}
 */
export function getCategoryFromDescription(description) {
  const desc = (description || "").toLowerCase().trim();
  if (!desc) return DEFAULT_CATEGORY;

  for (const category of EXPENSE_CATEGORIES) {
    const matched = category.keywords.some((kw) => desc.includes(kw));
    if (matched) return category;
  }

  return DEFAULT_CATEGORY;
}

/**
 * Get category label only (for charts, reports).
 * @param {string} description
 * @returns {string}
 */
export function getCategoryLabel(description) {
  return getCategoryFromDescription(description).label;
}
