import { NextResponse } from "next/server";

// Cache image lookups in memory for instant responses and zero API rate limits
const imageCache = new Map();

// High-Resolution 4K World Atlas (Curated verified landscape & city photography for exact locations)
const HIGH_RES_ATLAS = {
  // Europe & Major Western Cities
  "paris": [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85", // Eiffel Tower sunset
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=2000&q=85", // Seine River & Louvre
    "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=2000&q=85", // Champs-Élysées
    "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?auto=format&fit=crop&w=2000&q=85", // Montmartre
  ],
  "eiffel": ["https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85"],
  "louvre": ["https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=2000&q=85"],
  "rome": [
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85", // Colosseum
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2000&q=85", // Trevi Fountain
    "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=2000&q=85", // Vatican
  ],
  "colosseum": ["https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85"],
  "venice": [
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=2000&q=85",
  ],
  "florence": ["https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=2000&q=85"],
  "milan": ["https://images.unsplash.com/photo-1520175480921-4edfa2983e5f?auto=format&fit=crop&w=2000&q=85"],
  "italy": [
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2000&q=85",
  ],
  "london": [
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=2000&q=85",
  ],
  "uk": ["https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2000&q=85"],
  "switzerland": [
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=2000&q=85",
  ],
  "alps": ["https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85"],
  "spain": [
    "https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=2000&q=85",
  ],
  "barcelona": ["https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=2000&q=85"],
  "greece": [
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=2000&q=85",
  ],
  "santorini": ["https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2000&q=85"],
  "athens": ["https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=2000&q=85"],
  "amsterdam": ["https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=2000&q=85"],
  "netherlands": ["https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=2000&q=85"],
  "germany": ["https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2000&q=85"],
  "berlin": ["https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=2000&q=85"],
  "iceland": ["https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=2000&q=85"],
  "norway": ["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=2000&q=85"],
  "europe": [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85",
  ],

  // Japan & East Asia
  "tokyo": [
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85",
  ],
  "kyoto": [
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=2000&q=85",
  ],
  "fuji": ["https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=2000&q=85"],
  "osaka": ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=85"],
  "japan": [
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=85",
  ],
  "seoul": ["https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=2000&q=85"],
  "korea": ["https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=2000&q=85"],
  "china": ["https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85"],

  // Kerala & South India
  "munnar": [
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=2000&q=85",
  ],
  "alleppey": ["https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=85"],
  "houseboat": ["https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=85"],
  "kochi": ["https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=2000&q=85"],
  "backwaters": ["https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=2000&q=85"],
  "ooty": ["https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=2000&q=85"],
  "coorg": ["https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=2000&q=85"],
  "hampi": ["https://images.unsplash.com/photo-1600100397608-f010f423b971?auto=format&fit=crop&w=2000&q=85"],
  "mysore": ["https://images.unsplash.com/photo-1600100397608-f010f423b971?auto=format&fit=crop&w=2000&q=85"],
  "kerala": [
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=2000&q=85",
  ],

  // Goa & Coastal Beaches
  "goa": [
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=2000&q=85",
  ],
  "baga": ["https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=85"],
  "palolem": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85"],
  "anjuna": ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=85"],

  // North & Central India
  "taj mahal": ["https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=85"],
  "agra": ["https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=85"],
  "jaipur": ["https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85"],
  "rajasthan": [
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=2000&q=85",
  ],
  "manali": ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2000&q=85"],
  "shimla": ["https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=2000&q=85"],
  "ladakh": ["https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=2000&q=85"],
  "rishikesh": ["https://images.unsplash.com/photo-1591017403286-fd8493524e1e?auto=format&fit=crop&w=2000&q=85"],
  "varanasi": ["https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=2000&q=85"],
  "delhi": ["https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=2000&q=85"],
  "mumbai": ["https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=2000&q=85"],
  "india": [
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=85",
  ],

  // Dubai & Middle East / Africa
  "dubai": [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=2000&q=85",
  ],
  "burj khalifa": ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=85"],
  "egypt": [
    "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1572252009286-268acec5ca0a?auto=format&fit=crop&w=2000&q=85",
  ],
  "pyramids": ["https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=2000&q=85"],
  "morocco": ["https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=2000&q=85"],
  "safari": ["https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2000&q=85"],

  // USA & Americas
  "new york": [
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?auto=format&fit=crop&w=2000&q=85",
  ],
  "usa": ["https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=2000&q=85"],
  "san francisco": ["https://images.unsplash.com/photo-1501594907352-06c4fb91b0bd?auto=format&fit=crop&w=2000&q=85"],
  "hawaii": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85"],
  "banff": ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=85"],
  "canada": ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=85"],
  "peru": ["https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=2000&q=85"],
  "machu picchu": ["https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=2000&q=85"],
  "brazil": ["https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=2000&q=85"],
  "mexico": ["https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=2000&q=85"],

  // Southeast Asia & Tropical Islands
  "bali": [
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=2000&q=85",
  ],
  "maldives": [
    "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
  ],
  "thailand": [
    "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=2000&q=85",
  ],
  "phuket": ["https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=2000&q=85"],
  "singapore": ["https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2000&q=85"],
  "australia": [
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=2000&q=85",
  ],
  "sydney": ["https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=2000&q=85"],
};

// Activity & Theme High-Res 4K Pools (Used when specific destination key matches a general category)
const ACTIVITY_POOLS = {
  "beach": [
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=85",
  ],
  "mountain": [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1432462770865-65b70566d673?auto=format&fit=crop&w=2000&q=85",
  ],
  "castle": [
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85",
  ],
  "temple": [
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85",
  ],
  "museum": [
    "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=2000&q=85",
  ],
  "food": [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85",
  ],
  "lake": [
    "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
  ],
  "forest": [
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=2000&q=85",
  ],
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dest = (searchParams.get("dest") || "").trim().toLowerCase();
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const index = parseInt(searchParams.get("index") || "-1", 10);

  const combined = `${dest} ${query}`;
  const cacheKey = `${combined}:::${index}`;

  if (imageCache.has(cacheKey)) {
    return NextResponse.redirect(imageCache.get(cacheKey), {
      status: 307,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  }

  // 1. Check exact location / destination keywords in our high-res 4K atlas first
  for (const [key, photos] of Object.entries(HIGH_RES_ATLAS)) {
    if (combined.includes(key)) {
      const selectedUrl = photos[Math.abs(index >= 0 ? index : 0) % photos.length];
      imageCache.set(cacheKey, selectedUrl);
      return NextResponse.redirect(selectedUrl, {
        status: 307,
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
      });
    }
  }

  // 2. Check activity keywords if no specific destination matched
  for (const [key, photos] of Object.entries(ACTIVITY_POOLS)) {
    if (combined.includes(key)) {
      const selectedUrl = photos[Math.abs(index >= 0 ? index : 0) % photos.length];
      imageCache.set(cacheKey, selectedUrl);
      return NextResponse.redirect(selectedUrl, {
        status: 307,
        headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
      });
    }
  }

  // 3. Dynamic Wikipedia & Pollinations AI Image Fetch for any unique location/stop on Earth
  // Clean the destination or query term (e.g. remove "Day 1:", "Stop 1:", numbers, etc.)
  let cleanTerm = (dest || query || "travel landmark")
    .replace(/^day\s*\d+[:\-]\s*/i, "")
    .replace(/^stop\s*\d+[:\-]\s*/i, "")
    .replace(/day\s*\d+/ig, "")
    .replace(/stop\s*\d+/ig, "")
    .trim();

  if (!cleanTerm) cleanTerm = "scenic travel destination";

  // Attempt to query Wikipedia REST API for exact verified place thumbnail
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanTerm)}&gsrlimit=1&prop=pageimages&pithumbsize=1600&format=json`,
      { signal: AbortSignal.timeout(3500) }
    );
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData?.query?.pages) {
        const pages = Object.values(wikiData.query.pages);
        if (pages.length > 0 && pages[0].thumbnail?.source) {
          const wikiImageUrl = pages[0].thumbnail.source;
          imageCache.set(cacheKey, wikiImageUrl);
          return NextResponse.redirect(wikiImageUrl, {
            status: 307,
            headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
          });
        }
      }
    }
  } catch {
    // If Wikipedia query times out or fails, proceed to high-resolution AI / dynamic photo generation below
  }

  // 4. Fallback to Pollinations AI dynamic image generator tailored to the exact location
  const dynamicImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanTerm + " travel landmark photography 4k high resolution scenic")}/?width=1200&height=800&nologo=true&seed=${Math.abs(index >= 0 ? index * 997 : 42)}`;
  
  imageCache.set(cacheKey, dynamicImageUrl);
  return NextResponse.redirect(dynamicImageUrl, {
    status: 307,
    headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
  });
}
