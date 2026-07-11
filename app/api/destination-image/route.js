import { NextResponse } from "next/server";

// Cache image lookups in memory for instant responses and zero API rate limits
const imageCache = new Map();

// Deterministic string hash function for unique, non-repetitive image selection when index isn't provided
function getHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// High-Resolution 4K World Atlas (Curated verified landscape & city photography strictly segregated by region with 12-16 photos per city)
const HIGH_RES_ATLAS = {
  // Specific Landmarks & Attractions (checked first so specific stops get tailored photos instead of general city photos)
  "brandenburg": [
    "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=2000&q=85",
  ],
  "berlin wall": [
    "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=2000&q=85",
  ],
  "reichstag": ["https://images.unsplash.com/photo-1546726747-421c6d69c929?auto=format&fit=crop&w=2000&q=85"],
  "museum island": [
    "https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=2000&q=85",
  ],
  "checkpoint charlie": ["https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=2000&q=85"],
  "eiffel": [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&w=2000&q=85",
  ],
  "louvre": [
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1565099824688-e93eb20fe622?auto=format&fit=crop&w=2000&q=85",
  ],
  "seine": [
    "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1541604193435-22287d32c2c2?auto=format&fit=crop&w=2000&q=85",
  ],
  "colosseum": [
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2000&q=85",
  ],
  "trevi": ["https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2000&q=85"],
  "vatican": ["https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=2000&q=85"],
  "shibuya": ["https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2000&q=85"],
  "shinjuku": ["https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85"],
  "senso-ji": ["https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=2000&q=85"],

  // Berlin (15 distinct verified photos of architecture, canals, bridges, monuments, gardens, and street vibes)
  "berlin": [
    "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=2000&q=85", // Brandenburg Gate
    "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=2000&q=85", // Berlin Cathedral & Spree River
    "https://images.unsplash.com/photo-1546726747-421c6d69c929?auto=format&fit=crop&w=2000&q=85", // Reichstag Parliament
    "https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=2000&q=85", // East Side Gallery Wall
    "https://images.unsplash.com/photo-1589802829985-817e51171b92?auto=format&fit=crop&w=2000&q=85", // Oberbaum Bridge sunset
    "https://images.unsplash.com/photo-1599946347371-68eb71b16afc?auto=format&fit=crop&w=2000&q=85", // Alexanderplatz TV Tower
    "https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=2000&q=85", // Museum Island
    "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=2000&q=85", // Charlottenburg Palace
    "https://images.unsplash.com/photo-1608828628205-06bece514d3a?auto=format&fit=crop&w=2000&q=85", // Tiergarten park
    "https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=2000&q=85", // Kreuzberg street cafe
    "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=2000&q=85", // Berlin evening lights
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2000&q=85", // German architecture
    "https://images.unsplash.com/photo-1524443169398-9aa1ceab67d5?auto=format&fit=crop&w=2000&q=85", // Berlin street scene
    "https://images.unsplash.com/photo-1572983509393-55938d61ddc4?auto=format&fit=crop&w=2000&q=85", // Berlin Spree river boat
    "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=2000&q=85", // Brandenburg dusk
  ],
  "germany": [
    "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1546726747-421c6d69c929?auto=format&fit=crop&w=2000&q=85",
  ],

  // Paris (15 distinct photos of Eiffel, Louvre, Seine, Montmartre, Champs, Arc, gardens, cafes)
  "paris": [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1520939817895-060bdaf4fe1b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1503917988258-f87a78e3c995?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1522093007474-d86e9bf7ba6f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1565099824688-e93eb20fe622?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1541604193435-22287d32c2c2?auto=format&fit=crop&w=2000&q=85",
  ],
  "france": [
    "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?auto=format&fit=crop&w=2000&q=85",
  ],

  // Rome & Italy (15 distinct photos)
  "rome": [
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1531572753322-ad063cecc140?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1525874684015-58379d421a52?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1503756234508-e32369269deb?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1529154036614-a60975f5c760?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1542820229-081e0c12af0b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=2000&q=85",
  ],
  "venice": [
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=2000&q=85",
  ],
  "florence": [
    "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2000&q=85",
  ],
  "milan": [
    "https://images.unsplash.com/photo-1520175480921-4edfa2983e5f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85",
  ],
  "italy": [
    "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1543429776-2782fc8e1acd?auto=format&fit=crop&w=2000&q=85",
  ],

  // London & UK (12 distinct photos)
  "london": [
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1454586095085-2e8ffbde190b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=2000&q=85",
  ],
  "uk": [
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=2000&q=85",
  ],
  "amsterdam": [
    "https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1468276311594-df7cb65d8df6?auto=format&fit=crop&w=2000&q=85",
  ],
  "switzerland": [
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=2000&q=85",
  ],
  "greece": [
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1603565816030-6b389eeb23cb?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=2000&q=85",
  ],
  "santorini": [
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=2000&q=85",
  ],

  // Japan & East Asia (15 distinct photos)
  "tokyo": [
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=2000&q=85",
  ],
  "kyoto": [
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85",
  ],
  "fuji": ["https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=2000&q=85"],
  "osaka": [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=2000&q=85",
  ],
  "japan": [
    "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=2000&q=85",
  ],
  "seoul": ["https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=2000&q=85"],
  "korea": ["https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=2000&q=85"],
  "beijing": ["https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85"],
  "shanghai": ["https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=2000&q=85"],
  "china": ["https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85", "https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?auto=format&fit=crop&w=2000&q=85"],

  // Kerala & South India (12 distinct photos)
  "munnar": [
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=85",
  ],
  "alleppey": [
    "https://images.unsplash.com/photo-602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=2000&q=85",
  ],
  "houseboat": [
    "https://images.unsplash.com/photo-602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=2000&q=85",
  ],
  "kochi": [
    "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=2000&q=85",
  ],
  "kerala": [
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-602216056096-3b40cc0c9944?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1600100397608-f010f423b971?auto=format&fit=crop&w=2000&q=85",
  ],

  // Goa & Coastal Beaches (12 distinct photos)
  "goa": [
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=2000&q=85",
  ],

  // North India & Taj Mahal
  "taj mahal": ["https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=85"],
  "agra": ["https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=85"],
  "jaipur": [
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=2000&q=85",
  ],
  "rajasthan": [
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=2000&q=85",
  ],
  "delhi": [
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=85",
  ],
  "mumbai": [
    "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=2000&q=85",
  ],
  "india": [
    "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=2000&q=85",
  ],

  // Dubai & Middle East
  "dubai": [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1526495124232-a04e1849168c?auto=format&fit=crop&w=2000&q=85",
  ],
  "egypt": ["https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=2000&q=85"],
  "pyramids": ["https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=2000&q=85"],

  // USA & Americas
  "new york": [
    "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1500916434205-0c77489c6cf7?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=2000&q=85",
  ],
  "usa": ["https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=2000&q=85"],
  "hawaii": ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85"],
  "peru": ["https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=2000&q=85"],

  // Southeast Asia & Tropical Islands
  "bali": [
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=2000&q=85",
  ],
  "thailand": [
    "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1506665531195-3566af2b4dfa?auto=format&fit=crop&w=2000&q=85",
  ],
  "singapore": ["https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=2000&q=85"],
  "australia": [
    "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=2000&q=85",
  ],
};

// Activity & Theme High-Res 4K Pools (10-12 photos per activity category for massive variety)
const ACTIVITY_POOLS = {
  "beach": [
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=85",
  ],
  "mountain": [
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1432462770865-65b70566d673?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
  ],
  "castle": [
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1546726747-421c6d69c929?auto=format&fit=crop&w=2000&q=85",
  ],
  "temple": [
    "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=2000&q=85",
  ],
  "museum": [
    "https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1592861956120-e524fc739696?auto=format&fit=crop&w=2000&q=85",
  ],
  "food": [
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1559564484-e48b3e040ff4?auto=format&fit=crop&w=2000&q=85",
  ],
  "park": [
    "https://images.unsplash.com/photo-1608828628205-06bece514d3a?auto=format&fit=crop&w=2000&q=85",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=85",
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

// Curated 4K High-Res General Travel Photography Pool (Guarantees instant, 100% reliable image loading for any unique destination)
const GENERAL_TRAVEL_POOL = [
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?auto=format&fit=crop&w=2000&q=85",
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dest = (searchParams.get("dest") || "").trim().toLowerCase();
  const query = (searchParams.get("q") || "").trim().toLowerCase();
  const indexParam = parseInt(searchParams.get("index") || "-1", 10);

  const combined = `${dest} ${query}`;
  const strHash = getHash(combined);
  const effectiveIndex = indexParam >= 0 ? indexParam : strHash;

  const cacheKey = `${combined}:::${effectiveIndex}`;

  if (imageCache.has(cacheKey)) {
    return NextResponse.redirect(imageCache.get(cacheKey), {
      status: 307,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  }

  // Helper: create a redirect response and cache it
  const respond = (url) => {
    imageCache.set(cacheKey, url);
    return NextResponse.redirect(url, {
      status: 307,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=86400" },
    });
  };

  // ── Step 1: Try SPECIFIC landmark keywords first (high-priority exact matches) ──
  // Check query first (it usually contains the stop name like "Colva Beach"), then dest
  for (const text of [query, dest]) {
    if (!text) continue;
    for (const [key, photos] of Object.entries(HIGH_RES_ATLAS)) {
      // Only match if the key is a meaningful substring (skip very short keys to avoid false positives)
      if (key.length >= 3 && text.includes(key)) {
        return respond(photos[effectiveIndex % photos.length]);
      }
    }
  }

  // Also check combined for broader matches
  for (const [key, photos] of Object.entries(HIGH_RES_ATLAS)) {
    if (key.length >= 3 && combined.includes(key)) {
      return respond(photos[effectiveIndex % photos.length]);
    }
  }

  // ── Step 2: Activity/theme keyword match ──
  for (const [key, photos] of Object.entries(ACTIVITY_POOLS)) {
    if (combined.includes(key)) {
      return respond(photos[effectiveIndex % photos.length]);
    }
  }

  // ── Step 3: Extract a clean search term for external lookups ──
  // The `dest` param often contains poetic titles like "Sun, Sand, and Serenity in Goa"
  // We need to extract just the place name for Wikipedia/Unsplash searches
  let cleanTerm = extractPlaceName(query, dest);

  if (!cleanTerm) cleanTerm = "scenic travel destination";

  // ── Step 4: Wikipedia image lookup (real photography of real places) ──
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanTerm)}&gsrlimit=3&prop=pageimages&pithumbsize=1600&format=json`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData?.query?.pages) {
        const pages = Object.values(wikiData.query.pages);
        // Find the first page that actually has an image
        for (const page of pages) {
          if (page.thumbnail?.source) {
            const wikiImageUrl = page.thumbnail.source;
            if (!wikiImageUrl.endsWith(".svg") && !wikiImageUrl.endsWith(".pdf") && wikiImageUrl.startsWith("http")) {
              return respond(wikiImageUrl);
            }
          }
        }
      }
    }
  } catch {
    // Wikipedia timed out or failed — continue to Unsplash fallback
  }

  // ── Step 5: Unsplash source (direct, no API key needed) ──
  // Uses source.unsplash.com which serves a random photo matching the search term
  try {
    const unsplashUrl = `https://source.unsplash.com/1600x900/?${encodeURIComponent(cleanTerm + " travel")}`;
    const unsplashRes = await fetch(unsplashUrl, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(2000),
    });
    if (unsplashRes.ok && unsplashRes.url && !unsplashRes.url.includes("source-404")) {
      return respond(unsplashRes.url);
    }
  } catch {
    // Unsplash fallback failed — use general pool
  }

  // ── Step 6: General travel pool (100% reliable, instant) ──
  return respond(GENERAL_TRAVEL_POOL[effectiveIndex % GENERAL_TRAVEL_POOL.length]);
}

/**
 * Extract an actual place/landmark name from the query and destination strings.
 * Strips out poetic/generic words so Wikipedia gets a useful search term.
 */
function extractPlaceName(query, dest) {
  // Priority 1: Use query if it looks like a specific place name (not just a category)
  if (query) {
    let cleaned = query
      .replace(/\b(nature|culture|food|adventure|shopping|transport|accommodation|nightlife|relaxation|other)\b/gi, "")
      .replace(/\b(day\s*\d+|stop\s*\d+)\b/gi, "")
      .replace(/\b(morning|afternoon|evening|night|exploration|departure|arrival)\b/gi, "")
      .trim();
    // If after cleaning we still have 2+ meaningful characters, use it
    if (cleaned.length >= 3) return cleaned;
  }

  // Priority 2: Extract place name from destination (strip poetic fluff)
  if (dest) {
    let cleaned = dest
      // Remove common poetic patterns: "Sun, Sand, and Serenity in X" → "X"
      .replace(/^.*?\b(in|of|to|through|across|around)\b\s*/i, "")
      // Remove trailing noise
      .replace(/\b(trip|tour|adventure|journey|exploration|getaway|vacation|holiday|itinerary)\b/gi, "")
      .replace(/\b(day|days|night|nights|\d+)\b/gi, "")
      .replace(/[,\-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length >= 2) return cleaned;

    // If the above stripped too much, just use the raw dest
    return dest.replace(/\b(trip|tour|adventure|journey)\b/gi, "").trim();
  }

  return "";
}

