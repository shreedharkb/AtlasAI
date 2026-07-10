// High-contrast SVG shape (pure AtlasAI typography without icon) for WebGL MetallicPaint liquid chrome effect
export const ATLAS_AI_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 120" width="380" height="120"><text x="15" y="88" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="88" letter-spacing="-3.5" fill="%23000000">AtlasAI</text></svg>`;

// Category definitions with colors and icons (Lucide React names)
export const CATEGORIES = {
  culture: {
    label: "Culture",
    iconName: "Landmark",
    color: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    lightColor: "bg-violet-100 text-violet-700 border-violet-200",
  },
  food: {
    label: "Food",
    iconName: "Utensils",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    lightColor: "bg-orange-100 text-orange-700 border-orange-200",
  },
  nature: {
    label: "Nature",
    iconName: "TreePine",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    lightColor: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  shopping: {
    label: "Shopping",
    iconName: "ShoppingBag",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    lightColor: "bg-pink-100 text-pink-700 border-pink-200",
  },
  transport: {
    label: "Transport",
    iconName: "Train",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    lightColor: "bg-blue-100 text-blue-700 border-blue-200",
  },
  accommodation: {
    label: "Stay",
    iconName: "Hotel",
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    lightColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  adventure: {
    label: "Adventure",
    iconName: "Mountain",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    lightColor: "bg-amber-100 text-amber-700 border-amber-200",
  },
  nightlife: {
    label: "Nightlife",
    iconName: "Martini",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    lightColor: "bg-purple-100 text-purple-700 border-purple-200",
  },
  relaxation: {
    label: "Relax",
    iconName: "Coffee",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    lightColor: "bg-cyan-100 text-cyan-700 border-cyan-200",
  },
  other: {
    label: "Other",
    iconName: "MapPin",
    color: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    lightColor: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export const EXAMPLE_PROMPTS = [
  {
    title: "Weekend in Tokyo",
    text: "Plan a 3-day trip to Tokyo focused on food, temples, and anime culture. Budget-friendly.",
  },
  {
    title: "Goa Beach Getaway",
    text: "5-day Goa trip with beach hopping, nightlife, water sports, and Portuguese heritage sites.",
  },
  {
    title: "European Adventure",
    text: "7-day backpacking trip through Paris, Amsterdam, and Berlin. Include museums, street food, and nightlife.",
  },
  {
    title: "Kerala Backwaters",
    text: "4-day Kerala trip covering Munnar tea gardens, Alleppey houseboat, and Kochi's Fort area.",
  },
];

export const ERROR_MESSAGES = {
  NETWORK: {
    title: "Connection Lost",
    description: "Couldn't reach the server. Check your internet and try again.",
    type: "network",
  },
  TIMEOUT: {
    title: "Taking Too Long",
    description: "The AI is taking longer than expected. Try a simpler trip description.",
    type: "timeout",
  },
  PARSE_ERROR: {
    title: "AI Response Issue",
    description: "The AI returned something unexpected. Let's try again — it usually works on retry.",
    type: "parse",
  },
  RATE_LIMIT: {
    title: "Too Many Requests",
    description: "We've hit the rate limit. Please wait a moment and try again.",
    type: "rate_limit",
  },
  SERVER_ERROR: {
    title: "Server Error",
    description: "Something went wrong on our end. Please try again.",
    type: "server",
  },
  EMPTY_RESPONSE: {
    title: "Empty Response",
    description: "The AI returned an empty response. Try describing your trip differently.",
    type: "empty",
  },
  API_KEY_MISSING: {
    title: "API Key Not Set",
    description: "The Groq API key is not configured. Please check the .env.local file.",
    type: "config",
  },
};

export function getDestinationImage(query = "", destination = "", dayIndex = -1) {
  const cleanDest = destination ? destination.trim() : "";
  const cleanQuery = query ? query.trim() : "";

  // Dynamically query Wikipedia and Wikimedia Commons via internal high-speed endpoint to get 100% verified real-world photography
  return `/api/destination-image?dest=${encodeURIComponent(cleanDest)}&q=${encodeURIComponent(cleanQuery)}&index=${dayIndex}`;
}
