// Static catalog data for The Scent Lab
// All products reference locally generated imagery in /images/products.

export type Gender = "Women" | "Men" | "Unisex"
export type CollectionTag = "Luxury" | "Niche" | "Gift"
export type Season = "Spring" | "Summer" | "Autumn" | "Winter"
export type Occasion =
  | "Daytime"
  | "Evening"
  | "Office"
  | "Date Night"
  | "Special Occasion"
  | "Casual"

export interface VolumeOption {
  ml: number
  price: number
}

export interface ProductNotes {
  top: string[]
  heart: string[]
  base: string[]
}

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  title: string
  body: string
}

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  brandSlug: string
  gender: Gender
  category: "Perfume" | "Eau de Parfum" | "Eau de Toilette" | "Gift Set"
  collection: CollectionTag[]
  image: string
  gallery: string[]
  volumes: VolumeOption[]
  compareAtPrice?: number
  rating: number
  reviewCount: number
  description: string
  story: string
  notes: ProductNotes
  longevity: number // 1-5
  projection: number // 1-5
  sillage: number // 1-5
  seasons: Season[]
  occasions: Occasion[]
  country: string
  year: number
  tags: ("New" | "Bestseller" | "Trending" | "Sale" | "Featured")[]
  stock: number
  reviews: Review[]
}

export interface Brand {
  slug: string
  name: string
  country: string
  founded: number
  tagline: string
  description: string
  productCount: number
}

export interface JournalPost {
  id: string
  title: string
  excerpt: string
  category: string
  date: string
  readTime: string
  image: string
}

const img = (f: string) => `/images/products/${f}`

export const brands: Brand[] = [
  {
    slug: "dior",
    name: "Dior",
    country: "France",
    founded: 1946,
    tagline: "Parisian elegance, bottled.",
    description:
      "Christian Dior's fragrance house has defined modern luxury perfumery since 1946, blending floral artistry with bold contemporary character.",
    productCount: 2,
  },
  {
    slug: "chanel",
    name: "Chanel",
    country: "France",
    founded: 1910,
    tagline: "The art of timeless allure.",
    description:
      "From the legendary No. 5 to the modern Bleu de Chanel, the House of Chanel crafts fragrances that transcend generations.",
    productCount: 2,
  },
  {
    slug: "tom-ford",
    name: "Tom Ford",
    country: "United States",
    founded: 2006,
    tagline: "Unapologetic, opulent, refined.",
    description:
      "Tom Ford's Private Blend redefines luxury perfumery with rich, distinctive compositions for the modern connoisseur.",
    productCount: 2,
  },
  {
    slug: "maison-francis-kurkdjian",
    name: "Maison Francis Kurkdjian",
    country: "France",
    founded: 2009,
    tagline: "Sensuality in a crystal flacon.",
    description:
      "Master perfumer Francis Kurkdjian's eponymous house creates luminous, sensuous fragrances beloved worldwide.",
    productCount: 1,
  },
  {
    slug: "creed",
    name: "Creed",
    country: "France",
    founded: 1760,
    tagline: "Centuries of artisan craft.",
    description:
      "Founded in 1760, Creed is one of the oldest fragrance houses, crafting bespoke scents by hand for royalty and connoisseurs.",
    productCount: 1,
  },
  {
    slug: "le-labo",
    name: "Le Labo",
    country: "United States",
    founded: 2006,
    tagline: "Slow perfumery, made by hand.",
    description:
      "Le Labo reinvents the apothecary tradition with handcrafted, numbered bottles and singular, memorable compositions.",
    productCount: 1,
  },
  {
    slug: "byredo",
    name: "Byredo",
    country: "Sweden",
    founded: 2006,
    tagline: "Scandinavian minimalism, olfactive poetry.",
    description:
      "Ben Gorham's Byredo pairs Nordic restraint with global inspiration for quietly modern, cult-favorite fragrances.",
    productCount: 1,
  },
  {
    slug: "jo-malone",
    name: "Jo Malone London",
    country: "United Kingdom",
    founded: 1994,
    tagline: "Fragrance to be layered and lived in.",
    description:
      "Jo Malone London's elegant, combinable scents bring a distinctly British sensibility to modern perfumery.",
    productCount: 1,
  },
  {
    slug: "ysl",
    name: "Yves Saint Laurent",
    country: "France",
    founded: 1961,
    tagline: "Bold. Free. Magnetic.",
    description:
      "YSL Beauty channels the rebellious spirit of Saint Laurent into magnetic, nocturnal fragrances.",
    productCount: 1,
  },
  {
    slug: "prada",
    name: "Prada",
    country: "Italy",
    founded: 1913,
    tagline: "Italian refinement, reimagined.",
    description:
      "Prada Parfums marries timeless Italian craftsmanship with avant-garde olfactive research.",
    productCount: 1,
  },
  {
    slug: "versace",
    name: "Versace",
    country: "Italy",
    founded: 1978,
    tagline: "Excess, glamour, desire.",
    description:
      "Versace fragrances capture the bold, unapologetic glamour of the Medusa house.",
    productCount: 1,
  },
  {
    slug: "hermes",
    name: "Hermès",
    country: "France",
    founded: 1837,
    tagline: "Hermès craftsmanship, distilled.",
    description:
      "Hermès Parfums translates the maison's artisanal heritage into refined, earthy compositions.",
    productCount: 1,
  },
  {
    slug: "marc-jacobs",
    name: "Marc Jacobs",
    country: "United States",
    founded: 2001,
    tagline: "Playful, iconic, irresistible.",
    description:
      "Marc Jacobs fragrances bring a joyful, design-forward sensibility to everyday luxury.",
    productCount: 1,
  },
]

export const categories = [
  {
    slug: "women",
    name: "Women",
    description: "Florals, orientals and modern signatures.",
    image: img("p-dior-jadore.png"),
  },
  {
    slug: "men",
    name: "Men",
    description: "Woody, aromatic and boldly contemporary.",
    image: img("p-dior-sauvage.png"),
  },
  {
    slug: "unisex",
    name: "Unisex",
    description: "Shared scents beyond convention.",
    image: img("p-lelabo-santal.png"),
  },
] as const

export const collections = [
  {
    slug: "luxury",
    name: "Luxury Collection",
    tagline: "The world's most coveted flacons",
    description:
      "An edit of the rarest, most sought-after fragrances from the houses that define modern luxury.",
    image: "/images/col-luxury.png",
  },
  {
    slug: "niche",
    name: "Niche Collection",
    tagline: "Artisan houses, singular visions",
    description:
      "Discover independent and artisan perfumers crafting distinctive scents far from the mainstream.",
    image: "/images/col-niche.png",
  },
  {
    slug: "gift",
    name: "Gift Collection",
    tagline: "Considered gifts, beautifully wrapped",
    description:
      "Curated sets and ready-to-gift fragrances for every occasion and every person.",
    image: "/images/col-gift.png",
  },
] as const

const mkReviews = (rows: [string, number, string, string, string][]): Review[] =>
  rows.map(([author, rating, date, title, body], i) => ({
    id: `r${i + 1}`,
    author,
    rating,
    date,
    title,
    body,
  }))

export const products: Product[] = [
  {
    id: "1",
    slug: "dior-sauvage-eau-de-toilette",
    name: "Sauvage Eau de Toilette",
    brand: "Dior",
    brandSlug: "dior",
    gender: "Men",
    category: "Eau de Toilette",
    collection: ["Luxury"],
    image: img("p-dior-sauvage.png"),
    gallery: [img("p-dior-sauvage.png")],
    volumes: [
      { ml: 60, price: 112 },
      { ml: 100, price: 152 },
      { ml: 200, price: 215 },
    ],
    rating: 4.8,
    reviewCount: 1284,
    description:
      "A radically fresh composition, raw and noble all at once. Bergamot pepper and ambroxan meet the breath of the Calabrian wind.",
    story:
      "Inspired by wide open spaces and the desert at twilight, Sauvage is a composition of raw, noble ingredients — Calabrian bergamot, Sichuan pepper and ambroxan — that evokes the elemental.",
    notes: {
      top: ["Calabrian Bergamot", "Pepper"],
      heart: ["Sichuan Pepper", "Lavender", "Geranium"],
      base: ["Ambroxan", "Cedar", "Labdanum"],
    },
    longevity: 4,
    projection: 4,
    sillage: 4,
    seasons: ["Spring", "Summer", "Autumn"],
    occasions: ["Daytime", "Office", "Casual", "Date Night"],
    country: "France",
    year: 2015,
    tags: ["Bestseller", "Trending", "Featured"],
    stock: 42,
    reviews: mkReviews([
      ["Élodie M.", 5, "2024-11-02", "My partner's signature", "Fresh, magnetic and incredibly versatile. Lasts all day on him."],
      ["James R.", 4, "2024-10-18", "A modern classic", "Clean and crowd-pleasing. Projection is excellent in the first few hours."],
      ["Sara K.", 5, "2024-09-30", "Can't go wrong", "Bought for a gift and it was a hit. The bergamot opening is gorgeous."],
    ]),
  },
  {
    id: "2",
    slug: "chanel-bleu-de-chanel-eau-de-parfum",
    name: "Bleu de Chanel Eau de Parfum",
    brand: "Chanel",
    brandSlug: "chanel",
    gender: "Men",
    category: "Eau de Parfum",
    collection: ["Luxury"],
    image: img("p-chanel-bleu.png"),
    gallery: [img("p-chanel-bleu.png")],
    volumes: [
      { ml: 50, price: 128 },
      { ml: 100, price: 175 },
      { ml: 150, price: 230 },
    ],
    rating: 4.7,
    reviewCount: 968,
    description:
      "A woody, aromatic fragrance that reveals the spirit of a man who chooses his own destiny. Fresh, clean and profoundly sensual.",
    story:
      "An ode to freedom, Bleu de Chanel blends citrus freshness with the depth of cedar and sandalwood for a scent both assertive and understated.",
    notes: {
      top: ["Grapefruit", "Lemon", "Mint"],
      heart: ["Ginger", "Nutmeg", "Jasmine"],
      base: ["Incense", "Vetiver", "Cedar", "Sandalwood"],
    },
    longevity: 4,
    projection: 4,
    sillage: 3,
    seasons: ["Autumn", "Winter", "Spring"],
    occasions: ["Office", "Evening", "Date Night"],
    country: "France",
    year: 2014,
    tags: ["Bestseller", "Featured"],
    stock: 31,
    reviews: mkReviews([
      ["Marcus T.", 5, "2024-11-12", "Refined and lasting", "Sophisticated woody scent that turns heads without shouting."],
      ["Priya N.", 4, "2024-10-22", "Great for the office", "Clean and professional. I get compliments all day."],
    ]),
  },
  {
    id: "3",
    slug: "tom-ford-tobacco-vanille",
    name: "Tobacco Vanille",
    brand: "Tom Ford",
    brandSlug: "tom-ford",
    gender: "Unisex",
    category: "Eau de Parfum",
    collection: ["Luxury", "Niche"],
    image: img("p-tomford-tobacco.png"),
    gallery: [img("p-tomford-tobacco.png")],
    volumes: [
      { ml: 50, price: 245 },
      { ml: 100, price: 390 },
    ],
    rating: 4.9,
    reviewCount: 612,
    description:
      "Rich and warming, Tobacco Vanille pairs the opulent dryness of tobacco leaf with sweet vanilla, cocoa and dried fruits.",
    story:
      "A Private Blend icon, Tobacco Vanille evokes a gentlemen's club warmed by a crackling fire — tobacco leaf, vanilla and tonka bean in luxurious harmony.",
    notes: {
      top: ["Tobacco Leaf", "Spicy Notes"],
      heart: ["Vanilla", "Cacao", "Tonka Bean"],
      base: ["Dried Fruits", "Woodsy Notes"],
    },
    longevity: 5,
    projection: 4,
    sillage: 4,
    seasons: ["Autumn", "Winter"],
    occasions: ["Evening", "Special Occasion", "Date Night"],
    country: "United States",
    year: 2007,
    tags: ["Bestseller", "Featured"],
    stock: 18,
    reviews: mkReviews([
      ["Hana L.", 5, "2024-11-20", "Winter perfection", "Like wrapping yourself in a warm cashmere blanket. Sweet, smoky, divine."],
      ["Daniel W.", 5, "2024-10-05", "Worth every penny", "Lasts forever and projects beautifully. A true cold-weather masterpiece."],
    ]),
  },
  {
    id: "4",
    slug: "mfk-baccarat-rouge-540",
    name: "Baccarat Rouge 540 Eau de Parfum",
    brand: "Maison Francis Kurkdjian",
    brandSlug: "maison-francis-kurkdjian",
    gender: "Unisex",
    category: "Eau de Parfum",
    collection: ["Luxury", "Niche"],
    image: img("p-mfk-baccarat.png"),
    gallery: [img("p-mfk-baccarat.png")],
    volumes: [
      { ml: 35, price: 185 },
      { ml: 70, price: 320 },
      { ml: 200, price: 560 },
    ],
    rating: 4.9,
    reviewCount: 847,
    description:
      "A poetic alchemy of saffron, amberwood and jasmine. Radiant, mineral and endlessly memorable.",
    story:
      "Created to celebrate the 250th anniversary of the Baccarat crystal house, this luminous amber floral is a modern cult icon.",
    notes: {
      top: ["Saffron", "Jasmine"],
      heart: ["Amberwood", "Ambergris"],
      base: ["Fir Resin", "Cedar"],
    },
    longevity: 5,
    projection: 5,
    sillage: 5,
    seasons: ["Spring", "Autumn", "Winter"],
    occasions: ["Evening", "Special Occasion", "Date Night"],
    country: "France",
    year: 2015,
    tags: ["Bestseller", "Trending", "Featured"],
    stock: 12,
    reviews: mkReviews([
      ["Aria S.", 5, "2024-11-25", "Heaven in a bottle", "Sweet, airy and magnetic. Strangers ask what I'm wearing constantly."],
      ["Leo F.", 5, "2024-10-10", "Beast mode", "Projection and longevity are unreal. One spray lasts all day."],
    ]),
  },
  {
    id: "5",
    slug: "creed-aventus",
    name: "Aventus",
    brand: "Creed",
    brandSlug: "creed",
    gender: "Men",
    category: "Eau de Parfum",
    collection: ["Luxury"],
    image: img("p-creed-aventus.png"),
    gallery: [img("p-creed-aventus.png")],
    volumes: [
      { ml: 50, price: 295 },
      { ml: 100, price: 445 },
    ],
    rating: 4.7,
    reviewCount: 1102,
    description:
      "A bold, fruity-chypre celebrating strength, vision and success. Pineapple, birch and oakmoss define its unmistakable character.",
    story:
      "Inspired by the dramatic life of Napoleon, Aventus is a fragrance of triumph — a confident blend of fruit, woods and musk hand-mixed by Creed.",
    notes: {
      top: ["Pineapple", "Bergamot", "Blackcurrant", "Apple"],
      heart: ["Birch", "Patchouli", "Moroccan Jasmine"],
      base: ["Oakmoss", "Musk", "Ambergris", "Vanilla"],
    },
    longevity: 4,
    projection: 5,
    sillage: 5,
    seasons: ["Spring", "Summer", "Autumn"],
    occasions: ["Daytime", "Office", "Special Occasion"],
    country: "France",
    year: 2010,
    tags: ["Bestseller", "Trending", "Featured"],
    stock: 9,
    reviews: mkReviews([
      ["Owen H.", 5, "2024-11-15", "Compliment king", "The pineapple opening is legendary. Worth the price for special days."],
      ["Mira G.", 4, "2024-10-08", "Batch variation", "Beautiful scent — projection varies a bit by batch but always gorgeous."],
    ]),
  },
  {
    id: "6",
    slug: "le-labo-santal-33",
    name: "Santal 33",
    brand: "Le Labo",
    brandSlug: "le-labo",
    gender: "Unisex",
    category: "Eau de Parfum",
    collection: ["Niche"],
    image: img("p-lelabo-santal.png"),
    gallery: [img("p-lelabo-santal.png")],
    volumes: [
      { ml: 50, price: 195 },
      { ml: 100, price: 295 },
    ],
    rating: 4.6,
    reviewCount: 738,
    description:
      "A unisex cult favorite — cardamom, iris and a sweeping sandalwood that captures the spirit of the American West.",
    story:
      "Santal 33 evokes an olfactive image of the Wild West — a marigold sunset, leather saddles and the warm glow of sandalwood. Hand-labeled with your name.",
    notes: {
      top: ["Cardamom", "Violet", "Iris"],
      heart: ["Ambrette", "Leather"],
      base: ["Sandalwood", "Cedar", "Papyrus"],
    },
    longevity: 4,
    projection: 4,
    sillage: 4,
    seasons: ["Autumn", "Winter", "Spring"],
    occasions: ["Daytime", "Office", "Casual"],
    country: "United States",
    year: 2011,
    tags: ["Bestseller", "Trending", "Featured"],
    stock: 25,
    reviews: mkReviews([
      ["Noor A.", 5, "2024-11-18", "My signature for years", "Smoky, creamy sandalwood. Everyone recognizes it now — for good reason."],
      ["Theo P.", 4, "2024-10-02", "Distinctive", "Very unique and cozy. Can be a bit much in summer but perfect indoors."],
    ]),
  },
  {
    id: "7",
    slug: "byredo-gypsy-water",
    name: "Gypsy Water",
    brand: "Byredo",
    brandSlug: "byredo",
    gender: "Unisex",
    category: "Eau de Parfum",
    collection: ["Niche"],
    image: img("p-byredo-gypsy.png"),
    gallery: [img("p-byredo-gypsy.png")],
    volumes: [
      { ml: 50, price: 180 },
      { ml: 100, price: 260 },
    ],
    rating: 4.5,
    reviewCount: 412,
    description:
      "An ode to the Romany lifestyle — pine needle, lemon and vanilla evoking forest campfires and open roads.",
    story:
      "Gypsy Water is a quiet, woody-aromatic reverie on the freedom of the open road, grounded in pine and warmed by amber and vanilla.",
    notes: {
      top: ["Bergamot", "Lemon", "Pepper", "Juniper Berries"],
      heart: ["Incense", "Pine Needles", "Orris"],
      base: ["Amber", "Vanilla", "Sandalwood"],
    },
    longevity: 3,
    projection: 3,
    sillage: 3,
    seasons: ["Autumn", "Spring"],
    occasions: ["Daytime", "Casual", "Office"],
    country: "Sweden",
    year: 2008,
    tags: ["New", "Featured"],
    stock: 22,
    reviews: mkReviews([
      ["Ines D.", 5, "2024-11-10", "Quietly beautiful", "Soft, woody and comforting. A Nordic forest in a bottle."],
    ]),
  },
  {
    id: "8",
    slug: "jo-malone-wood-sage-sea-salt",
    name: "Wood Sage & Sea Salt",
    brand: "Jo Malone London",
    brandSlug: "jo-malone",
    gender: "Unisex",
    category: "Cologne",
    collection: ["Niche"],
    image: img("p-jomalone-woodsage.png"),
    gallery: [img("p-jomalone-woodsage.png")],
    volumes: [
      { ml: 30, price: 88 },
      { ml: 100, price: 165 },
      { ml: 150, price: 210 },
    ],
    rating: 4.6,
    reviewCount: 533,
    description:
      "Take a walk along the coast. Sea salt and sage meet the woody driftwood of the shore — fresh, free and elemental.",
    story:
      "Wood Sage & Sea Salt captures the spray of the English coast — mineral sea salt, earthy sage and sun-warmed driftwood.",
    notes: {
      top: ["Sea Salt", "Ambrette Seed"],
      heart: ["Sage", "Grapefruit"],
      base: ["Red Algae", "Driftwood"],
    },
    longevity: 3,
    projection: 3,
    sillage: 3,
    seasons: ["Spring", "Summer"],
    occasions: ["Daytime", "Casual", "Office"],
    country: "United Kingdom",
    year: 2014,
    tags: ["New", "Featured"],
    stock: 34,
    reviews: mkReviews([
      ["Clara V.", 5, "2024-11-22", "Coastal in a bottle", "Fresh, airy and unique. Like a breezy day at the beach."],
    ]),
  },
  {
    id: "9",
    slug: "ysl-black-opium-eau-de-parfum",
    name: "Black Opium Eau de Parfum",
    brand: "Yves Saint Laurent",
    brandSlug: "ysl",
    gender: "Women",
    category: "Eau de Parfum",
    collection: ["Luxury"],
    image: img("p-ysl-blackopium.png"),
    gallery: [img("p-ysl-blackopium.png")],
    volumes: [
      { ml: 30, price: 95 },
      { ml: 50, price: 130 },
      { ml: 90, price: 168 },
    ],
    compareAtPrice: 150,
    rating: 4.7,
    reviewCount: 1456,
    description:
      "A rock-chic addiction of coffee and vanilla. Bold, feminine and unapologetically seductive.",
    story:
      "Black Opium is the scent of a woman who lives by night — coffee and vanilla wrapped in white flowers for a darkly magnetic signature.",
    notes: {
      top: ["Pink Pepper", "Orange Blossom"],
      heart: ["Coffee", "Jasmine", "Bitter Almond"],
      base: ["Vanilla", "Patchouli", "Cedar"],
    },
    longevity: 4,
    projection: 4,
    sillage: 4,
    seasons: ["Autumn", "Winter"],
    occasions: ["Evening", "Date Night", "Special Occasion"],
    country: "France",
    year: 2014,
    tags: ["Bestseller", "Sale", "Featured"],
    stock: 38,
    reviews: mkReviews([
      ["Yuki T.", 5, "2024-11-19", "My go-to evening scent", "Warm, sweet and seductive. The coffee note is addictive."],
      ["Rosa M.", 4, "2024-10-14", "Great value on sale", "Long-lasting and cozy. A bit sweet but lovely in cooler weather."],
    ]),
  },
  {
    id: "10",
    slug: "prada-candy-eau-de-parfum",
    name: "Candy Eau de Parfum",
    brand: "Prada",
    brandSlug: "prada",
    gender: "Women",
    category: "Eau de Parfum",
    collection: ["Luxury"],
    image: img("p-prada-candy.png"),
    gallery: [img("p-prada-candy.png")],
    volumes: [
      { ml: 30, price: 90 },
      { ml: 50, price: 120 },
      { ml: 80, price: 158 },
    ],
    rating: 4.5,
    reviewCount: 327,
    description:
      "An overdose of caramel and white musks — joyful, indulgent and impossibly chic.",
    story:
      "Prada Candy is a fragrance of excess and optimism, a caramel-white-musk accord that's as playful as it is refined.",
    notes: {
      top: ["Caramel"],
      heart: ["White Musk", "Powdery Notes"],
      base: ["Benzoin", "Vanilla"],
    },
    longevity: 4,
    projection: 3,
    sillage: 3,
    seasons: ["Autumn", "Winter"],
    occasions: ["Daytime", "Casual", "Date Night"],
    country: "Italy",
    year: 2011,
    tags: ["New"],
    stock: 27,
    reviews: mkReviews([
      ["Bianca R.", 5, "2024-11-08", "Gourmand dream", "Sweet, warm and cozy. Caramel lovers, this is for you."],
    ]),
  },
  {
    id: "11",
    slug: "versace-eros-eau-de-toilette",
    name: "Eros Eau de Toilette",
    brand: "Versace",
    brandSlug: "versace",
    gender: "Men",
    category: "Eau de Toilette",
    collection: ["Luxury"],
    image: img("p-versace-eros.png"),
    gallery: [img("p-versace-eros.png")],
    volumes: [
      { ml: 50, price: 78 },
      { ml: 100, price: 105 },
      { ml: 200, price: 145 },
    ],
    compareAtPrice: 120,
    rating: 4.6,
    reviewCount: 892,
    description:
      "A fragrance of desire. Mint, green apple and tonka bean collide for a bold, sensual statement.",
    story:
      "Eros is the fragrance of a man confident in his own body and desires — a sweet-fresh-woody scent that commands attention.",
    notes: {
      top: ["Mint", "Green Apple", "Lemon"],
      heart: ["Tonka Bean", "Geranium", "Ambroxan"],
      base: ["Vanilla", "Vetiver", "Oakmoss", "Cedar"],
    },
    longevity: 4,
    projection: 5,
    sillage: 5,
    seasons: ["Spring", "Summer", "Autumn"],
    occasions: ["Evening", "Date Night", "Casual"],
    country: "Italy",
    year: 2012,
    tags: ["Bestseller", "Sale", "Trending"],
    stock: 51,
    reviews: mkReviews([
      ["Diego F.", 5, "2024-11-14", "Compliment magnet", "Sweet and bold. Projects like crazy — a little goes a long way."],
    ]),
  },
  {
    id: "12",
    slug: "chanel-no-5-eau-de-parfum",
    name: "N°5 Eau de Parfum",
    brand: "Chanel",
    brandSlug: "chanel",
    gender: "Women",
    category: "Eau de Parfum",
    collection: ["Luxury"],
    image: img("p-chanel-no5.png"),
    gallery: [img("p-chanel-no5.png")],
    volumes: [
      { ml: 35, price: 115 },
      { ml: 50, price: 145 },
      { ml: 100, price: 215 },
    ],
    rating: 4.8,
    reviewCount: 1023,
    description:
      "The most legendary fragrance in the world. Aldehydes, jasmine and rose meet warm vetiver and vanilla in eternal harmony.",
    story:
      "Created in 1921, N°5 was the first fragrance to showcase aldehydes and to bear a designer's name. A century later, it remains the symbol of feminine modernity.",
    notes: {
      top: ["Aldehydes", "Ylang-Ylang", "Neroli", "Bergamot"],
      heart: ["Iris", "Jasmine", "Rose", "Lily of the Valley"],
      base: ["Vetiver", "Sandalwood", "Vanilla", "Musk"],
    },
    longevity: 5,
    projection: 3,
    sillage: 3,
    seasons: ["Spring", "Autumn", "Winter"],
    occasions: ["Evening", "Special Occasion", "Office"],
    country: "France",
    year: 1921,
    tags: ["Bestseller", "Featured"],
    stock: 29,
    reviews: mkReviews([
      ["Margaux L.", 5, "2024-11-21", "Timeless", "My grandmother wore this and so do I. Nothing else comes close."],
    ]),
  },
  {
    id: "13",
    slug: "tom-ford-black-orchid",
    name: "Black Orchid",
    brand: "Tom Ford",
    brandSlug: "tom-ford",
    gender: "Unisex",
    category: "Eau de Parfum",
    collection: ["Luxury", "Niche"],
    image: img("p-tomford-blackorchid.png"),
    gallery: [img("p-tomford-blackorchid.png")],
    volumes: [
      { ml: 30, price: 165 },
      { ml: 50, price: 225 },
      { ml: 100, price: 360 },
    ],
    rating: 4.7,
    reviewCount: 489,
    description:
      "A luxurious and sensual fragrance of black truffle, ylang-ylang and black orchid — modern, opulent and unmistakable.",
    story:
      "Black Orchid is a rich, dark accord built around the mythical black orchid — warm, spicy and endlessly seductive.",
    notes: {
      top: ["Truffle", "Gardenia", "Black Currant", "Ylang-Ylang"],
      heart: ["Orchid", "Spices", "Lotus Wood"],
      base: ["Mexican Chocolate", "Patchouli", "Vetiver", "Incense"],
    },
    longevity: 5,
    projection: 4,
    sillage: 4,
    seasons: ["Autumn", "Winter"],
    occasions: ["Evening", "Special Occasion", "Date Night"],
    country: "United States",
    year: 2006,
    tags: ["New", "Featured"],
    stock: 16,
    reviews: mkReviews([
      ["Selena O.", 5, "2024-11-16", "Dark and luxurious", "Rich, chocolatey and sexy. A real statement fragrance."],
    ]),
  },
  {
    id: "14",
    slug: "dior-jadore-eau-de-parfum",
    name: "J'adore Eau de Parfum",
    brand: "Dior",
    brandSlug: "dior",
    gender: "Women",
    category: "Eau de Parfum",
    collection: ["Luxury"],
    image: img("p-dior-jadore.png"),
    gallery: [img("p-dior-jadore.png")],
    volumes: [
      { ml: 30, price: 98 },
      { ml: 50, price: 132 },
      { ml: 100, price: 195 },
    ],
    rating: 4.7,
    reviewCount: 764,
    description:
      "A bouquet of flowers gathered in a single scent — ylang-ylang, damascus rose and jasmine for luminous femininity.",
    story:
      "J'adore is an opulent floral harmony celebrating the flowers of Grasse — a glowing, golden celebration of femininity.",
    notes: {
      top: ["Ylang-Ylang", "Pear", "Bergamot", "Melon"],
      heart: ["Damascus Rose", "Jasmine", "Plum", "Orchid"],
      base: ["Musk", "Vanilla", "Blackberry", "Cedar"],
    },
    longevity: 4,
    projection: 3,
    sillage: 3,
    seasons: ["Spring", "Summer"],
    occasions: ["Daytime", "Office", "Special Occasion"],
    country: "France",
    year: 1999,
    tags: ["Bestseller", "Featured"],
    stock: 33,
    reviews: mkReviews([
      ["Camille B.", 5, "2024-11-11", "Luminous floral", "Fresh, elegant and universally flattering. A perfect daytime scent."],
    ]),
  },
  {
    id: "15",
    slug: "hermes-terre-dhermes",
    name: "Terre d'Hermès",
    brand: "Hermès",
    brandSlug: "hermes",
    gender: "Men",
    category: "Eau de Toilette",
    collection: ["Luxury", "Niche"],
    image: img("p-hermes-terre.png"),
    gallery: [img("p-hermes-terre.png")],
    volumes: [
      { ml: 50, price: 110 },
      { ml: 100, price: 155 },
      { ml: 200, price: 220 },
    ],
    rating: 4.7,
    reviewCount: 596,
    description:
      "A journey from earth to sky. Orange and grapefruit meet flint, vetiver and cedar in a mineral woody signature.",
    story:
      "Terre d'Hermès is a contemplation of man's relationship with the earth — citrus light meeting the depth of woods and minerals.",
    notes: {
      top: ["Orange", "Grapefruit", "Flint"],
      heart: ["Pepper", "Geranium", "Pelargonium"],
      base: ["Vetiver", "Benzoin", "Cedar", "Patchouli"],
    },
    longevity: 5,
    projection: 4,
    sillage: 3,
    seasons: ["Autumn", "Winter", "Spring"],
    occasions: ["Office", "Daytime", "Evening"],
    country: "France",
    year: 2006,
    tags: ["New", "Featured"],
    stock: 24,
    reviews: mkReviews([
      ["Antoine P.", 5, "2024-11-17", "Earthy elegance", "Citrus over wet earth and vetiver. Sophisticated and unique."],
    ]),
  },
  {
    id: "16",
    slug: "marc-jacobs-daisy-eau-de-toilette",
    name: "Daisy Eau de Toilette",
    brand: "Marc Jacobs",
    brandSlug: "marc-jacobs",
    gender: "Women",
    category: "Eau de Toilette",
    collection: ["Gift"],
    image: img("p-marcjacobs-daisy.png"),
    gallery: [img("p-marcjacobs-daisy.png")],
    volumes: [
      { ml: 30, price: 72 },
      { ml: 50, price: 92 },
      { ml: 100, price: 124 },
    ],
    compareAtPrice: 110,
    rating: 4.6,
    reviewCount: 1107,
    description:
      "Fresh and playful — strawberry, violet petals and jasmine with warm musk. A bright, sunny floral.",
    story:
      "Daisy is a whimsical, optimistic floral — wild strawberries and white florals under the iconic daisy cap. Joy in a bottle.",
    notes: {
      top: ["Wild Strawberry", "Violet Leaf", "Ruby Red Grapefruit"],
      heart: ["Violet Petals", "Jasmine", "Gardenia"],
      base: ["Musk", "Vanilla", "White Woods"],
    },
    longevity: 3,
    projection: 3,
    sillage: 3,
    seasons: ["Spring", "Summer"],
    occasions: ["Daytime", "Casual", "Office"],
    country: "United States",
    year: 2007,
    tags: ["Bestseller", "Sale", "Trending"],
    stock: 47,
    reviews: mkReviews([
      ["Lena W.", 5, "2024-11-13", "Happy in a bottle", "Light, fresh and youthful. My everyday spring scent."],
    ]),
  },
]

export interface JournalArticle extends JournalPost {
  slug: string
  body: string[]
  author: string
}

export const journal: JournalPost[] = [
  {
    id: "j1",
    title: "How to Find Your Signature Scent",
    excerpt:
      "A calm, practical guide to building a fragrance wardrobe that truly feels like you — from first spritz to skin chemistry.",
    category: "Guide",
    date: "Nov 18, 2024",
    readTime: "6 min read",
    image: "/images/journal-1.png",
  },
  {
    id: "j2",
    title: "Inside the Perfumer's Atelier",
    excerpt:
      "We step inside a working perfumer's lab to understand how a single accord becomes a finished flacon.",
    category: "Stories",
    date: "Nov 04, 2024",
    readTime: "8 min read",
    image: "/images/journal-2.png",
  },
  {
    id: "j3",
    title: "Understanding Fragrance Notes",
    excerpt:
      "Top, heart and base — what each layer means and why your scent transforms throughout the day.",
    category: "Guide",
    date: "Oct 22, 2024",
    readTime: "5 min read",
    image: "/images/journal-1.png",
  },
  {
    id: "j4",
    title: "How to Store Your Perfume",
    excerpt:
      "Light, heat and humidity are the enemies of fine fragrance. Here's how to make every bottle last.",
    category: "Guide",
    date: "Oct 08, 2024",
    readTime: "4 min read",
    image: "/images/journal-2.png",
  },
  {
    id: "j5",
    title: "The Art of Layering Fragrance",
    excerpt:
      "Why wear one scent when you can compose your own? A primer on combining fragrances with confidence.",
    category: "Guide",
    date: "Sep 24, 2024",
    readTime: "7 min read",
    image: "/images/journal-1.png",
  },
  {
    id: "j6",
    title: "A Brief History of Niche Perfumery",
    excerpt:
      "From Grasse to Brooklyn — how a handful of independent houses reshaped the way we think about scent.",
    category: "Stories",
    date: "Sep 10, 2024",
    readTime: "9 min read",
    image: "/images/journal-2.png",
  },
]

export const journalArticles: JournalArticle[] = [
  {
    ...journal[0],
    slug: "how-to-find-your-signature-scent",
    author: "The Scent Lab Editors",
    body: [
      "Finding a signature scent is less about following trends and more about listening to yourself. The right fragrance should feel like an extension of your personality — something you reach for without thinking.",
      "Start by identifying the families you're drawn to. Do you gravitate toward fresh citrus, warm amber, green florals or smoky woods? Visit a fragrance counter or order a discovery set and wear each scent for a full day.",
      "Pay attention to how the fragrance evolves. Top notes fade within minutes; the heart and base are what you'll live with for hours. Skin chemistry matters enormously — a scent that sings on a friend may fall flat on you, and vice versa.",
      "Build a small wardrobe rather than hunting for a single perfect perfume. A daytime fresh scent, an evening warm scent and a signature for special occasions will serve you better than one bottle you tire of.",
      "Above all, trust your nose. There are no wrong answers in perfumery — only scents that feel like you, and scents that don't.",
    ],
  },
  {
    ...journal[1],
    slug: "inside-the-perfumers-atelier",
    author: "Léa Dubois",
    body: [
      "Behind every bottle of fine fragrance is a perfumer — a nose — who spent months or years composing the accord inside. We visited a working atelier to understand the craft.",
      "The perfumer's organ, as the workspace is traditionally called, is a semicircle of hundreds of raw materials: natural absolutes, synthetics, tinctures and resins, each in its own labelled flask.",
      "A composition begins with a brief. The house may ask for a fragrance that evokes a Mediterranean garden, or a modern reinterpretation of a classic chypre. The perfumer sketches the structure first — the base, then the heart, then the top.",
      "Each trial is evaluated on blotting strips and on skin, then revisited days later as the dry-down reveals itself. A single fragrance may go through hundreds of modifications before it's deemed finished.",
      "What emerges is part science, part art — a composition designed to unfold over hours, telling a story on the skin of whoever wears it.",
    ],
  },
  {
    ...journal[2],
    slug: "understanding-fragrance-notes",
    author: "The Scent Lab Editors",
    body: [
      "Every fragrance is built in three layers: top, heart and base. Understanding this pyramid is the key to appreciating how a scent develops on your skin.",
      "Top notes are what you smell the moment you spray. They're typically light, volatile molecules — citrus, herbs, light fruits — that evaporate within the first 15 to 30 minutes.",
      "Heart notes emerge as the tops fade, forming the character of the fragrance. Florals, spices and green notes commonly live here, and they define what most people will remember about the scent.",
      "Base notes are the foundation — rich, heavy molecules like woods, musk, amber and vanilla that anchor the composition and linger for hours, sometimes days, on clothing.",
      "This is why a fragrance smells different in the morning than it does at lunchtime, and why you should always test a scent on your skin and wait before deciding.",
    ],
  },
  {
    ...journal[3],
    slug: "how-to-store-your-perfume",
    author: "Marcus Hale",
    body: [
      "Fine fragrance is delicate. A bottle kept carelessly can turn in a matter of months, losing its brightness and taking on a sour, metallic edge.",
      "The three enemies are light, heat and air. Ultraviolet light breaks down the aromatic molecules, which is why quality flacons are opaque or deeply tinted. Store your bottles in a closed cabinet or their original box.",
      "Heat accelerates oxidation. Avoid windowsills, radiators and bathrooms, where steam and temperature swings are constant. A cool, dark drawer is ideal.",
      "Once opened, a bottle begins a slow decline. Most fragrances stay true for three to five years; citrus and green scents turn fastest, while heavy ambers and woods age gracefully.",
      "Decanting into smaller atomizers helps for bottles you use rarely, as it reduces the air inside the flacon. And never shake a bottle — the agitation introduces oxygen and speeds degradation.",
    ],
  },
  {
    ...journal[4],
    slug: "art-of-layering-fragrance",
    author: "Sofia Romano",
    body: [
      "Layering — wearing two or more fragrances at once — is an old perfumery tradition enjoying a modern revival. Done well, it produces a scent that is unmistakably yours.",
      "Begin with a simple base. A clean musk, a light floral or a transparent wood makes an excellent canvas. Apply it first, generously, to pulse points.",
      "Add a second fragrance that contrasts or complements. A bright citrus over a warm amber creates depth; a green tea over a white floral adds freshness without sweetness.",
      "Keep the number of layers to two, occasionally three. More than that and the composition becomes muddy. Avoid combining two heavy, loud fragrances — let one lead and the other support.",
      "The joy of layering is that no two combinations are alike. Experiment, take notes on what works, and over time you'll develop a personal scent vocabulary that no single bottle could provide.",
    ],
  },
  {
    ...journal[5],
    slug: "brief-history-of-niche-perfumery",
    author: "Léa Dubois",
    body: [
      "For most of the twentieth century, perfume was the domain of a handful of grand houses — Chanel, Dior, Guerlain — producing fragrances designed to appeal to millions.",
      "The niche movement began quietly in the 1980s and 90s, when a new generation of perfumers rejected mass appeal in favor of singular, sometimes challenging compositions. Houses like L'Artisan Parfumeur and Serge Lutens led the way.",
      "By the 2000s, brands like Le Labo, Byredo and Maison Francis Kurkdjian had turned niche into a global phenomenon, proving that discerning customers would pay a premium for distinctive, less ubiquitous scents.",
      "What sets niche apart is not price or rarity alone, but intention. Niche houses make fragrances to express a point of view, not to fill a market gap. The result is a body of work that rewards exploration.",
      "Today the line between niche and mainstream has blurred — many niche houses are now owned by larger groups — but the spirit of independent perfumery endures, and the shelves of The Scent Lab are richer for it.",
    ],
  },
]

export const customerReviews = [
  {
    author: "Amara N.",
    location: "London, UK",
    rating: 5,
    title: "Authentic, fast, beautifully packed",
    body:
      "Every order arrives perfectly wrapped and 100% authentic. The Scent Lab has become my only fragrance shop.",
  },
  {
    author: "Lucas B.",
    location: "New York, USA",
    rating: 5,
    title: "The curation is unmatched",
    body:
      "They carry every house I love — from Creed to Le Labo — and the discovery experience is genuinely a pleasure.",
  },
  {
    author: "Sofia R.",
    location: "Milan, Italy",
    rating: 5,
    title: "Fast shipping, gorgeous packaging",
    body:
      "Two days to Milan, beautifully presented. The samples included helped me discover my new signature.",
  },
  {
    author: "Kenji A.",
    location: "Tokyo, Japan",
    rating: 5,
    title: "Trustworthy and refined",
    body:
      "I was nervous ordering niche perfume online, but everything was authentic and the service was impeccable.",
  },
]

// Helpers
export const getProduct = (slug: string) => products.find((p) => p.slug === slug)
export const productsByTag = (tag: Product["tags"][number]) =>
  products.filter((p) => p.tags.includes(tag))
export const productsByGender = (g: Gender) => products.filter((p) => p.gender === g)
export const productsByCollection = (c: CollectionTag) =>
  products.filter((p) => p.collection.includes(c))
export const brandBySlug = (slug: string) => brands.find((b) => b.slug === slug)
export const priceRange = () => {
  const all = products.flatMap((p) => p.volumes.map((v) => v.price))
  return { min: Math.min(...all), max: Math.max(...all) }
}

export const allCategories = ["Women", "Men", "Unisex"] as Gender[]
export const allCollections = ["Luxury", "Niche", "Gift"] as CollectionTag[]

// ---- Extended collections (for /collections page) ----
export interface CollectionDetail {
  slug: string
  name: string
  tagline: string
  description: string
  image: string
  longDescription: string
}

export const collectionDetails: CollectionDetail[] = [
  {
    slug: "luxury",
    name: "Luxury Collection",
    tagline: "The world's most coveted flacons",
    description:
      "An edit of the rarest, most sought-after fragrances from the houses that define modern luxury.",
    image: "/images/col-luxury.png",
    longDescription:
      "From the amber warmth of Tobacco Vanille to the radiant alchemy of Baccarat Rouge 540, the Luxury Collection gathers the fragrances that have come to define modern opulence. Each is a statement piece, crafted to be remembered.",
  },
  {
    slug: "niche",
    name: "Niche Collection",
    tagline: "Artisan houses, singular visions",
    description:
      "Discover independent and artisan perfumers crafting distinctive scents far from the mainstream.",
    image: "/images/col-niche.png",
    longDescription:
      "Niche perfumery is where the most original work in fragrance happens today. These are houses led by vision rather than committee — Le Labo, Byredo, Maison Francis Kurkdjian — producing compositions that reward close attention.",
  },
  {
    slug: "fresh",
    name: "Fresh",
    tagline: "Citrus, aquatic and green",
    description: "Crisp, clean and effortlessly wearable — the freshest scents in our edit.",
    image: "/images/products/p-jomalone-woodsage.png",
    longDescription:
      "Fresh fragrances are built around citrus, aquatic and green notes — the olfactive equivalent of cool linen and open windows. They're ideal for warm weather, daytime wear and anyone who prefers their scent to whisper rather than shout.",
  },
  {
    slug: "woody",
    name: "Woody",
    tagline: "Cedar, sandalwood and vetiver",
    description: "Warm, grounded and sophisticated — woody scents for every season.",
    image: "/images/products/p-lelabo-santal.png",
    longDescription:
      "Woody fragrances draw their character from cedar, sandalwood, vetiver and patchouli. They're the most versatile family in perfumery — equally at home in the office or on a winter evening — and they age beautifully on the skin.",
  },
  {
    slug: "office",
    name: "Office",
    tagline: "Polished, quiet, appropriate",
    description: "Considered scents that make an impression without overwhelming the room.",
    image: "/images/products/p-hermes-terre.png",
    longDescription:
      "The Office edit gathers fragrances that read as polished and professional — moderate projection, clean structure, nothing cloying. They're the scents you reach for on a Monday morning, when you want to feel put-together without making a scene.",
  },
  {
    slug: "summer",
    name: "Summer",
    tagline: "Light, bright, breezy",
    description: "Sun-ready scents that shine in heat and humidity.",
    image: "/images/products/p-marcjacobs-daisy.png",
    longDescription:
      "Summer fragrances are light, bright and refreshing — citrus, white florals and aquatic notes that perform beautifully in heat. They fade faster than heavy ambers, so reapplication is part of the pleasure.",
  },
  {
    slug: "winter",
    name: "Winter",
    tagline: "Warm, rich, enveloping",
    description: "Deep ambers, woods and gourmands for the coldest months.",
    image: "/images/products/p-tomford-tobacco.png",
    longDescription:
      "Winter fragrances lean into warmth — tobacco, vanilla, amber and spice that bloom in cold air. They're the scents of fireplaces and cashmere, designed to wrap around you when the temperature drops.",
  },
  {
    slug: "date-night",
    name: "Date Night",
    tagline: "Magnetic, memorable, a little daring",
    description: "Fragrances designed to turn heads and linger in memory.",
    image: "/images/products/p-ysl-blackopium.png",
    longDescription:
      "Date Night scents are bold without being overpowering — warm, sensual and just unpredictable enough to invite a second look. Think coffee, vanilla, dark florals and the kind of sillage that leaves a trace when you leave the room.",
  },
  {
    slug: "gift",
    name: "Gift Sets",
    tagline: "Considered gifts, beautifully wrapped",
    description: "Curated sets and ready-to-gift fragrances for every occasion.",
    image: "/images/col-gift.png",
    longDescription:
      "Whether you're shopping for a fragrance lover or a first-timer, the Gift Collection gathers our most giftable scents — universally flattering, beautifully presented and always appreciated. Complimentary wrapping on every order.",
  },
  {
    slug: "travel",
    name: "Travel Size",
    tagline: "Signature scents, to go",
    description: "Compact 10–30ml flacons for your bag, your desk and your next trip.",
    image: "/images/products/p-mfk-baccarat.png",
    longDescription:
      "Travel sizes let you carry your signature wherever you go — and they're the perfect low-commitment way to test a new scent. Every fragrance in our edit is available in a smaller format; this collection gathers our favorites.",
  },
]

export const collectionBySlug = (slug: string) =>
  collectionDetails.find((c) => c.slug === slug)

// Map a collection slug to a product filter
export function productsForCollection(slug: string): Product[] {
  const c = collectionBySlug(slug)
  if (!c) return []
  switch (slug) {
    case "luxury":
      return products.filter((p) => p.collection.includes("Luxury"))
    case "niche":
      return products.filter((p) => p.collection.includes("Niche"))
    case "gift":
      return products.filter((p) => p.collection.includes("Gift"))
    case "fresh":
      return products.filter((p) =>
        p.notes.top.some((n) => /bergamot|citrus|lemon|grapefruit|sea|mint|orange/i.test(n))
      )
    case "woody":
      return products.filter((p) =>
        [...p.notes.base, ...p.notes.heart].some((n) =>
          /sandalwood|cedar|vetiver|patchouli|wood|papyrus/i.test(n)
        )
      )
    case "office":
      return products.filter(
        (p) => p.projection <= 4 && p.occasions.includes("Office")
      )
    case "summer":
      return products.filter((p) => p.seasons.includes("Summer"))
    case "winter":
      return products.filter((p) => p.seasons.includes("Winter"))
    case "date-night":
      return products.filter((p) => p.occasions.includes("Date Night"))
    case "travel":
      return products.filter((p) => p.volumes.some((v) => v.ml <= 50))
    default:
      return []
  }
}

// ---- FAQs for product pages ----
export const productFAQs = [
  {
    q: "Is this fragrance authentic?",
    a: "Yes. Every fragrance we sell is sourced directly from the brand or an authorized distributor and is 100% authentic, sealed in its original packaging.",
  },
  {
    q: "How long will a bottle last?",
    a: "A 50ml bottle used daily (2–3 sprays) typically lasts 6–9 months. A 100ml bottle lasts about a year. Store it cool and dark to preserve its character.",
  },
  {
    q: "What size should I buy?",
    a: "If you're trying a fragrance for the first time, we recommend the smallest available size. For a confirmed favorite, the largest size offers the best value per millilitre.",
  },
  {
    q: "Can I return an opened bottle?",
    a: "Unopened bottles can be returned within 30 days for a full refund. Due to the nature of fragrance, opened bottles are non-returnable unless faulty.",
  },
  {
    q: "Do you offer samples?",
    a: "Yes — every order includes complimentary samples so you can discover something new. Discovery sets are also available for select houses.",
  },
]

// ---- Related products ----
export function relatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.brandSlug === product.brandSlug ||
          p.gender === product.gender ||
          p.collection.some((c) => product.collection.includes(c)) ||
          p.notes.base.some((n) => product.notes.base.includes(n)))
    )
    .slice(0, limit)
}

// ---- Journal helpers ----
export const articleBySlug = (slug: string) =>
  journalArticles.find((a) => a.slug === slug)

// ---- Breadcrumb type ----
export interface Crumb {
  label: string
  href?: string
}
