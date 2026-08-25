export type NewsArticle = {
  slug: string;
  tag: string;
  title: string;
  excerpt: string;
  image: string;
  readMinutes: number;
  source: string;
  url: string;
};

/**
 * Curated content shown on the Home dashboard's news carousel and the
 * dedicated /news page. This is static seed content (no CMS/API wired up
 * yet) — see recommendations for turning this into a live feed.
 */
export const NEWS_ARTICLES: NewsArticle[] = [
  {
    slug: "hidden-sodium",
    tag: "AI INSIGHT",
    title: "Hidden sodium: decoding food labels for everyday care",
    excerpt:
      "Sodium hides behind names like disodium phosphate and sodium benzoate. Here's what to scan for beyond the 'salt' line on the nutrition panel.",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
    readMinutes: 4,
    source: "PlateGuard Insights",
    url: "#",
  },
  {
    slug: "spotting-added-sugar",
    tag: "NUTRITION",
    title: "Spotting added sugar under 60 different names",
    excerpt:
      "Maltodextrin, dextrose, rice syrup solids — added sugar rarely says 'sugar.' A quick reference for the aliases that matter most.",
    image:
      "https://images.unsplash.com/photo-1587049352846-4a222e784d38?q=80&w=800&auto=format&fit=crop",
    readMinutes: 3,
    source: "PlateGuard Insights",
    url: "#",
  },
  {
    slug: "reading-medicine-interactions",
    tag: "MEDICINE",
    title: "Reading OTC medicine labels when you're on daily meds",
    excerpt:
      "NSAIDs, decongestants, antihistamines — small interactions add up. What to check before you grab something off the shelf.",
    image:
      "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop",
    readMinutes: 5,
    source: "PlateGuard Insights",
    url: "#",
  },
  {
    slug: "kids-allergen-labels",
    tag: "FAMILY",
    title: "Packing school snacks with a peanut allergy in the house",
    excerpt:
      "'May contain traces' isn't a footnote — it's a decision point. A practical framework for grading risk on shared-facility warnings.",
    image:
      "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=800&auto=format&fit=crop",
    readMinutes: 4,
    source: "PlateGuard Insights",
    url: "#",
  },
  {
    slug: "low-sodium-swaps",
    tag: "DASH DIET",
    title: "Five pantry swaps that cut sodium without cutting flavor",
    excerpt:
      "For anyone managing hypertension: practical ingredient swaps that keep meals satisfying while trimming sodium load.",
    image:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
    readMinutes: 3,
    source: "PlateGuard Insights",
    url: "#",
  },
  {
    slug: "gestational-diabetes-labels",
    tag: "PREGNANCY",
    title: "Grocery labels during gestational diabetes: a quick guide",
    excerpt:
      "Net carbs, glycemic load, and the additives worth a second look — a plain-English primer for label-reading during pregnancy.",
    image:
      "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=800&auto=format&fit=crop",
    readMinutes: 5,
    source: "PlateGuard Insights",
    url: "#",
  },
];
