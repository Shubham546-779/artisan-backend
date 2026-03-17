
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db/db');
console.log('🌱  Seeding Artisan Bazaar database…\n');
['users', 'products', 'orders', 'reviews', 'wishlist'].forEach(t => {
  const file = require('path').join(__dirname, '../data', `${t}.json`);
  require('fs').writeFileSync(file, '[]');
});
const PASSWORD_HASH = bcrypt.hashSync('password123', 10);

const sellers = [
  { id:'u1',  shopName:"Sarah Crafts",       name:"Sarah Miller" },
  { id:'u2',  shopName:"Pottery by James",   name:"James Potter" },
  { id:'u3',  shopName:"Artisan Elena",       name:"Elena Torres" },
  { id:'u4',  shopName:"Silver & Co.",        name:"Maya Singh" },
  { id:'u5',  shopName:"Golden Sparks",       name:"Liam Chen" },
  { id:'u6',  shopName:"Crystal Craft",       name:"Nora Walsh" },
  { id:'u7',  shopName:"Forge & Flame",       name:"Raj Patel" },
  { id:'u8',  shopName:"Pearl Studio",        name:"Isla Brown" },
  { id:'u9',  shopName:"Boho Belle",          name:"Amara Osei" },
  { id:'u10', shopName:"Luna Jewels",         name:"Finn Clarke" },
  { id:'u11', shopName:"Brass & Bold",        name:"Zara Ahmed" },
  { id:'u12', shopName:"Gem Artisan",         name:"Leo Park" },
];

sellers.forEach(s => db.insert('users', {
  id:           s.id,
  name:         s.name,
  email:        `${s.id}@artisanbazaar.com`,
  passwordHash: PASSWORD_HASH,
  role:         'seller',
  shopName:     s.shopName,
  avatarUrl:    null,
  bio:          `Handcrafting with love since 2018. ${s.shopName} delivers quality you can feel.`,
  location:     'India',
  memberSince:  '2023-01-01T00:00:00.000Z',
  verified:     true,
  salesCount:   Math.floor(Math.random() * 200) + 20,
  reviewCount:  Math.floor(Math.random() * 80) + 5,
  rating:       parseFloat((4 + Math.random()).toFixed(1)),
}));

db.insert('users', {
  id:           'buyer1',
  name:         'Demo Buyer',
  email:        'buyer@demo.com',
  passwordHash: PASSWORD_HASH,
  role:         'buyer',
  shopName:     null,
  avatarUrl:    null,
  bio:          null,
  location:     null,
  memberSince:  '2024-01-01T00:00:00.000Z',
  verified:     false,
  salesCount:   0,
  reviewCount:  0,
  rating:       0,
});

const products = [
  // Jewelry
  { id:'j1',  name:'Minimalist Silver Ring',      description:'Sterling silver ring, hand-forged and polished to a mirror finish. Each ring is unique.',             price:35,  category:'Jewelry',    imageUrl:'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800', sellerId:'u4', sellerName:'Silver & Co.'   },
  { id:'j2',  name:'Turquoise Beaded Bracelet',   description:'Natural turquoise stones hand-strung on silk thread, bohemian style.',                                 price:28,  category:'Jewelry',    imageUrl:'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=800', sellerId:'u4', sellerName:'Gem Artisan'    },
  { id:'j3',  name:'Gold Leaf Earrings',           description:'Delicate gold-plated leaf drop earrings, lightweight and elegant.',                                    price:42,  category:'Jewelry',    imageUrl:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=800', sellerId:'u5', sellerName:'Golden Sparks'  },
  { id:'j4',  name:'Amethyst Crystal Pendant',    description:"Raw amethyst wrapped in sterling silver wire on an 18\" chain.",                                       price:65,  category:'Jewelry',    imageUrl:'https://m.media-amazon.com/images/I/71wiZ3r0sbL._SY695_.jpg',                                   sellerId:'u6', sellerName:'Crystal Craft'  },
  { id:'j5',  name:'Copper Cuff Bracelet',         description:'Hammered copper cuff with tribal-inspired engravings.',                                                price:30,  category:'Jewelry',    imageUrl:'https://m.media-amazon.com/images/I/51KZPcTWYpL._SX695_.jpg',                                   sellerId:'u7', sellerName:'Forge & Flame'  },
  { id:'j6',  name:'Pearl Stud Set',               description:'Freshwater pearl studs with sterling silver posts. Classic and refined.',                              price:38,  category:'Jewelry',    imageUrl:'https://m.media-amazon.com/images/I/61gu2MrzJIL._SY695_.jpg',                                   sellerId:'u8', sellerName:'Pearl Studio'   },
  { id:'j7',  name:'Braided Leather Anklet',       description:'Hand-braided genuine leather with shell and bead accents.',                                            price:18,  category:'Jewelry',    imageUrl:'https://www.wovenstone.co/cdn/shop/products/Tan-_back_ddee215d-1b44-43e0-b736-3017e4e86fa4_900x.jpg?v=1580755528', sellerId:'u9', sellerName:'Boho Belle' },
  { id:'j8',  name:'Moonstone Ring Set',           description:'Three stackable rings with natural moonstones in rose gold fill.',                                     price:72,  category:'Jewelry',    imageUrl:'https://m.media-amazon.com/images/I/513YDcrDykL._SY695_.jpg',                                   sellerId:'u10',sellerName:'Luna Jewels'   },
  { id:'j9',  name:'Geometric Brass Necklace',     description:'Modern geometric pendant in brushed brass on a delicate chain.',                                       price:45,  category:'Jewelry',    imageUrl:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800', sellerId:'u11',sellerName:'Brass & Bold'   },
  { id:'j10', name:'Lapis Lazuli Choker',           description:'Deep blue lapis lazuli chips wired into a gorgeous choker necklace.',                                 price:55,  category:'Jewelry',    imageUrl:'https://m.media-amazon.com/images/I/61sMIBJkfnL._SY695_.jpg',                                   sellerId:'u12',sellerName:'Gem Artisan'   },
  // Home Decor
  { id:'h1',  name:'Hand-woven Macrame Wall Hanging', description:'Beautiful boho-style wall decor made with organic cotton rope.',                                    price:45,  category:'Home Decor', imageUrl:'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=800', sellerId:'u1', sellerName:'Sarah Crafts'   },
  { id:'h2',  name:'Handcrafted Ceramic Mug',      description:'Unique speckled glaze ceramic mug, perfect for your morning coffee.',                                  price:28,  category:'Home Decor', imageUrl:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800', sellerId:'u2', sellerName:'Pottery by James'},
  { id:'h3',  name:'Rattan Woven Basket Set',      description:'Set of 3 natural rattan baskets for stylish storage.',                                                 price:58,  category:'Home Decor', imageUrl:'https://m.media-amazon.com/images/I/71LfWq6VaRL._SX679_.jpg',                                   sellerId:'u3', sellerName:'Weave & Home'  },
  { id:'h4',  name:'Scented Soy Candle Trio',      description:'Three hand-poured soy candles: lavender, cedar, and vanilla.',                                         price:36,  category:'Home Decor', imageUrl:'https://www.thesparklestory.in/cdn/shop/files/DSC05039_3e343e1a-45d3-4295-b155-ffc556f980e8_700x.jpg?v=1769514615', sellerId:'u4', sellerName:'Glow & Grow' },
  { id:'h5',  name:'Driftwood Sculpture',          description:'Natural driftwood piece shaped into an abstract coastal sculpture.',                                    price:85,  category:'Home Decor', imageUrl:'https://5.imimg.com/data5/ECOM/Default/2024/7/439070031/IT/YL/ZU/98960525/2-branchesandrootsindriftwoodcraftbysureshpant.png', sellerId:'u5', sellerName:'Coastal Crafts' },
  { id:'h6',  name:'Terracotta Planter Set',       description:'Hand-stamped terracotta pots in three sizes, indoor or outdoor use.',                                  price:42,  category:'Home Decor', imageUrl:'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800', sellerId:'u6', sellerName:'Terra Garden'   },
  { id:'h7',  name:'Linen Throw Pillow',           description:'Hand block-printed linen pillow cover with geometric pattern.',                                        price:32,  category:'Home Decor', imageUrl:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800', sellerId:'u7', sellerName:'Block Print Co.' },
  { id:'h8',  name:'Woven Seagrass Rug',           description:'Naturally harvested seagrass woven into a 4x6 area rug.',                                              price:110, category:'Home Decor', imageUrl:'https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&q=80&w=800', sellerId:'u8', sellerName:'Floor & Thread'  },
  { id:'h9',  name:'Hand-carved Wooden Bowl',      description:'Bowl carved from a single piece of mango wood, food-safe finish.',                                     price:55,  category:'Home Decor', imageUrl:'https://www.nitori.co.in/cdn/shop/files/890228901_1197x1197.jpg?v=1728557726',                 sellerId:'u9', sellerName:'Wood & Wonder'  },
  { id:'h10', name:'Brass Bell Wind Chime',         description:'Set of five hand-cast brass bells tuned to a pentatonic scale.',                                      price:48,  category:'Home Decor', imageUrl:'https://images.unsplash.com/photo-1567225557594-88d73e55f2cb?auto=format&fit=crop&q=80&w=800', sellerId:'u10',sellerName:'Sound & Soul'   },
  // Clothing
  { id:'c1',  name:'Handmade Denim Jacket',        description:'Upcycled denim jacket with custom embroidered floral back panel.',                                     price:95,  category:'Clothing',   imageUrl:'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800', sellerId:'u1', sellerName:'Stitch & Style'  },
  { id:'c2',  name:'Tie-Dye Linen Maxi Dress',    description:'Hand-dyed linen maxi dress in sunset tones, free size.',                                               price:78,  category:'Clothing',   imageUrl:'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&q=80&w=800', sellerId:'u2', sellerName:'Boho Threads'   },
  { id:'c3',  name:'Crochet Beach Cardigan',       description:'Open-weave crochet cardigan, perfect layering piece for warm days.',                                   price:62,  category:'Clothing',   imageUrl:'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&q=80&w=800', sellerId:'u3', sellerName:'Hook & Yarn'     },
  { id:'c4',  name:'Block Print Kurta',            description:'Hand block-printed cotton kurta in indigo and white geometric print.',                                 price:55,  category:'Clothing',   imageUrl:'https://images.unsplash.com/photo-1562137369-1a1a0bc66744?auto=format&fit=crop&q=80&w=800', sellerId:'u4', sellerName:'Indigo Tales'    },
  { id:'c5',  name:'Knitted Wool Sweater',         description:'Cable-knit pullover sweater hand-knit from 100% merino wool.',                                         price:120, category:'Clothing',   imageUrl:'https://www.missmosa.in/cdn/shop/files/24CF1F9E-4352-4290-8BD6-DED1C8B3DD11.jpg?v=1749205907&width=1200', sellerId:'u5', sellerName:'Knit & Purl' },
  { id:'c6',  name:'Batik Print Wrap Skirt',       description:'Handmade batik-dyed wrap skirt with adjustable tie waist.',                                            price:44,  category:'Clothing',   imageUrl:'https://m.media-amazon.com/images/I/816AStAzoQL._SY879_.jpg',                                   sellerId:'u6', sellerName:'Batik House'     },
  { id:'c7',  name:'Embroidered Bucket Hat',       description:'Hand-embroidered floral motifs on a structured cotton canvas hat.',                                    price:35,  category:'Clothing',   imageUrl:'https://m.media-amazon.com/images/I/71f71z9IdML.jpg',                                           sellerId:'u7', sellerName:'Hat & Head'      },
  { id:'c8',  name:'Patchwork Tote Bag',           description:'Upcycled fabric scraps sewn into a vibrant patchwork carry-all tote.',                                 price:38,  category:'Clothing',   imageUrl:'https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80&w=800', sellerId:'u8', sellerName:'Patch & Carry'   },
  { id:'c9',  name:'Hand-painted Silk Scarf',      description:'Pure silk scarf painted with watercolor flowers by hand.',                                             price:88,  category:'Clothing',   imageUrl:'https://www.tenthousandvillages.com/cdn/shop/files/6896100_0001.jpg?v=1754399601&width=2048',   sellerId:'u9', sellerName:'Silk Stories'    },
  { id:'c10', name:'Macrame Fringed Vest',          description:'Bohemian macrame vest with intricate knotting and fringe detail.',                                    price:72,  category:'Clothing',   imageUrl:'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800', sellerId:'u10',sellerName:'Knot & Thread'   },
  // Art
  { id:'a1',  name:'Hand-painted Landscape Canvas', description:'Original acrylic painting of a mountain landscape, 24"x36", framed.',                                price:120, category:'Art',        imageUrl:'https://i.etsystatic.com/5220905/r/il/1bc63f/1600662593/il_570xN.1600662593_hn1o.jpg',         sellerId:'u3', sellerName:'Artisan Elena'   },
  { id:'a2',  name:'Watercolor Botanical Prints',  description:'Set of 4 botanical watercolors printed on archival paper.',                                            price:65,  category:'Art',        imageUrl:'https://images.bestofbharat.com/2025/05/TA-WRLD-PNGTS-CP8-FIRST-673-1-800x963.jpg',             sellerId:'u4', sellerName:'Paper & Bloom'   },
  { id:'a3',  name:'Abstract Ink Portrait',        description:'Original ink drawing — dramatic black and sepia tones.',                                               price:95,  category:'Art',        imageUrl:'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&q=80&w=800', sellerId:'u5', sellerName:'Ink & Soul'      },
  { id:'a4',  name:'Linocut Print — Forest',       description:'Hand-carved linoleum block printed on Japanese rice paper.',                                           price:48,  category:'Art',        imageUrl:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtREvAZTltTqIbVL9RKU7WER1CGKLe_6CVkA&s', sellerId:'u6', sellerName:'Press & Carve'  },
  { id:'a5',  name:'Resin Ocean Art Panel',        description:'Layered resin poured into ocean wave form on wood panel.',                                             price:180, category:'Art',        imageUrl:'https://images.bestofbharat.com/2021/08/B246-800x800.jpg',                                       sellerId:'u7', sellerName:'Resin Dreams'    },
  { id:'a6',  name:'Charcoal Cityscape Drawing',   description:'Original charcoal drawing of a misty urban skyline at dusk.',                                          price:75,  category:'Art',        imageUrl:'https://i.pinimg.com/564x/5a/51/f5/5a51f5edd2e0b8bf455e88ca9b120765.jpg',                       sellerId:'u8', sellerName:'Urban Sketch'    },
  { id:'a7',  name:'Mixed Media Collage',          description:'Layered collage using vintage paper, paint, and found objects.',                                        price:88,  category:'Art',        imageUrl:'https://cdn.myportfolio.com/fd2e11c1719ec0da15565667d65acb3f/7b56b6b2-f352-433c-a950-95da033992e2_rw_1200.jpg?h=4dc87242aad2e6faf1b62cf235a4a46f', sellerId:'u9', sellerName:'Layer & Layer' },
  { id:'a8',  name:'Oil Pastel Sunset',            description:'Vivid oil pastel piece capturing golden hour over still water.',                                        price:60,  category:'Art',        imageUrl:'https://i.ytimg.com/vi/h-9850GvK0g/maxresdefault.jpg',                                           sellerId:'u10',sellerName:'Pastel Studio'   },
  { id:'a9',  name:'Ceramic Wall Tiles — Birds',   description:'Set of 6 hand-painted glazed ceramic tiles with bird motifs.',                                         price:110, category:'Art',        imageUrl:'https://m.media-amazon.com/images/I/610Uq2jglEL._SX300_SY300_QL70_FMwebp_.jpg',                 sellerId:'u11',sellerName:'Tile & Fire'     },
  { id:'a10', name:'Gouache Mushroom Study',        description:'Detailed gouache study of wild mushrooms on black paper.',                                             price:52,  category:'Art',        imageUrl:'https://thumbs.dreamstime.com/b/gouache-art-four-small-bracket-fungi-wood-pieces-white-painting-growing-minimalist-natural-study-sharp-focus-383078181.jpg', sellerId:'u12', sellerName:'Fungi & Art' },
  // Toys
  { id:'t1',  name:'Wooden Kitchen Set',           description:'Premium handmade wooden kitchen playset with utensils.',                                               price:68,  category:'Toys',       imageUrl:'https://jagrishtitoys.com/cdn/shop/products/IMG-20220517-WA0021.jpg?v=1653318022&width=1445',   sellerId:'u1', sellerName:'Wood & Play'     },
  { id:'t2',  name:'Knitted Bunny Stuffed Animal', description:'Hand-knitted soft bunny from organic cotton yarn. Machine washable.',                                  price:32,  category:'Toys',       imageUrl:'https://i.etsystatic.com/12361433/r/il/3429b9/6408029051/il_1080xN.6408029051_s1hh.jpg',         sellerId:'u2', sellerName:'Soft & Sweet'    },
  { id:'t3',  name:'Wooden Stacking Rainbow',      description:'Smooth painted wooden rainbow arches for open-ended play.',                                            price:45,  category:'Toys',       imageUrl:'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcQ31vDEitvcBg1eRQazZN_1tgGVHreASAOcOsS_PToPJf6Lrwm9ne2NqvKGF_6S21PaJac_g20ij1s8XqBbxQ_dfW-9xaZmHQ', sellerId:'u3', sellerName:'Rainbow Wood' },
  { id:'t5',  name:'Hand-carved Puzzle Animals',   description:'Set of 5 interlocking wooden puzzle animal shapes.',                                                   price:38,  category:'Toys',       imageUrl:'https://littlewoodenwonders.com/cdn/shop/products/il_fullxfull.609854946_gjrj_1024x1024.jpg?v=1507322104', sellerId:'u5', sellerName:'Puzzle Wood' },
  { id:'t6',  name:'Macrame Doll Swing',           description:'Tiny knotted macrame swing for 12" dolls, decorative and playable.',                                   price:22,  category:'Toys',       imageUrl:'https://images.unsplash.com/photo-1563396983906-b3795482a59a?auto=format&fit=crop&q=80&w=800', sellerId:'u6', sellerName:'Doll World'      },
  { id:'t7',  name:'Wooden Train Set',             description:'Hand-painted wooden train with engine, two cars and track loops.',                                     price:75,  category:'Toys',       imageUrl:'https://m.media-amazon.com/images/I/313xNWXtxaL._SX300_SY300_QL70_FMwebp_.jpg',                 sellerId:'u7', sellerName:'Choo Choo Crafts'},
  { id:'t8',  name:'Sewn Cloth Book',              description:'Sensory fabric book with textures, zippers, buttons, and laces.',                                      price:28,  category:'Toys',       imageUrl:'https://imagedelivery.net/0ObHXyjKhN5YJrtuYFSvjQ/i-99d9f4c5-c32a-4044-8cb0-f6f2d8d19236-hand-stitched-fabric-book-cover-with-plain-sketch-book--bookmark-made-in-the-temple/display', sellerId:'u8', sellerName:'Cloth Stories' },
  { id:'t9',  name:'Beeswax Modeling Kit',         description:'Six natural beeswax blocks in rainbow colors for sculpting play.',                                     price:18,  category:'Toys',       imageUrl:'https://i0.wp.com/api-line.com/wp-content/uploads/2023/12/BMC2.png?fit=1024%2C576&ssl=1',       sellerId:'u9', sellerName:'Beeswax & Play'  },
  { id:'t10', name:'Wooden Balance Board',          description:'Smooth maple balance board with non-slip cork base. Ages 3–12.',                                      price:55,  category:'Toys',       imageUrl:'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQTgZhNZ93lBjRMmywzaKwW3DuA1qu9Khiirgb441V9guqwfKRjGh9nuEf2Tdl-YoGECP2p9ZyJTTvLP9Z3HlsoYlUQwninpB-WmHAbMsQHwr12LRD-Mc1P1A', sellerId:'u10', sellerName:'Balance & Grow' },
  // Gifts
  { id:'g1',  name:'Golden Rose Valentine Set',    description:'Preserved golden rose in a glass dome with ribbon and card.',                                          price:58,  category:'Gifts',      imageUrl:'https://ik.imagekit.io/fig/tr:w-600,h-700,pr-true,cm-pad_resize,bg-FFFFFF/image/image_site98/catalog/product/Valentine_Gift_38_4.jpg', sellerId:'u1', sellerName:'Petal & Gold' },
  { id:'g2',  name:'Personalized Leather Journal', description:'Hand-stitched leather journal with custom embossed initials.',                                         price:48,  category:'Gifts',      imageUrl:'https://m.media-amazon.com/images/I/619L9RvzZdL._SX522_.jpg',                                   sellerId:'u2', sellerName:'Bound & Bold'    },
  { id:'g3',  name:'Self-Care Hamper Box',         description:'Curated box with handmade soap, bath salts, candle and tea.',                                          price:72,  category:'Gifts',      imageUrl:'https://thegiftstudio.com/cdn/shop/files/Self_Care_Hamper_by_Masaba_1468375_01.png?v=1768808426', sellerId:'u3', sellerName:'Bloom & Care'    },
  { id:'g4',  name:'Memory Photo Locket',          description:'Custom locket with laser-engraved photo inside. Silver or gold.',                                      price:42,  category:'Gifts',      imageUrl:'https://m.media-amazon.com/images/I/61kxOnzosgL._SY675_.jpg',                                   sellerId:'u4', sellerName:'Locket Lane'     },
  { id:'g5',  name:'Hand-stamped Copper Bookmark', description:'Set of 3 hand-stamped copper bookmarks with motivational words.',                                      price:22,  category:'Gifts',      imageUrl:'https://www.wicksforge.com/cdn/shop/products/personalizedcopperbookmark5_1050x700.jpg?v=1617806249', sellerId:'u5', sellerName:'Stamp & Story' },
  { id:'g6',  name:'Soap & Lotion Gift Set',       description:'Artisan cold-process soap trio with whipped body butter.',                                             price:38,  category:'Gifts',      imageUrl:'https://brownliving.in/cdn/shop/products/gratitude-gift-bundle-verified-sustainable-products-on-brown-living-680187.jpg?v=1692888703', sellerId:'u6', sellerName:'Suds & Skin' },
  { id:'g7',  name:'Pressed Flower Card Set',      description:'Six greeting cards with real pressed wildflowers, blank inside.',                                      price:26,  category:'Gifts',      imageUrl:'https://m.media-amazon.com/images/I/817spFBWKRL._SX679_.jpg',                                   sellerId:'u7', sellerName:'Press & Post'    },
  { id:'g8',  name:'Wooden Name Puzzle',           description:'Custom-cut wooden puzzle spelling any name, painted and smooth.',                                      price:35,  category:'Gifts',      imageUrl:'https://m.media-amazon.com/images/I/51OqoVvhGQL._SX300_SY300_QL70_FMwebp_.jpg',                 sellerId:'u8', sellerName:'Name & Wood'     },
  { id:'g9',  name:'Artisan Tea Collection Box',   description:'Handmade wooden box with 8 varieties of loose-leaf herbal tea.',                                       price:52,  category:'Gifts',      imageUrl:'https://artisanteas.co.uk/wp-content/uploads/2024/12/teabx-01_05.jpeg',                           sellerId:'u9', sellerName:'Leaf & Brew'     },
  { id:'g10', name:'Embroidery Hoop Wall Art',      description:'Hand-embroidered floral hoop in a gift-ready wooden hoop frame.',                                    price:44,  category:'Gifts',      imageUrl:'https://craftmate.in/cdn/shop/files/04462C4E-A36F-4A9D-9C25-5B88DB55C91F.jpg?v=1743749995&width=713', sellerId:'u10', sellerName:'Hoop & Bloom' },
  // Other
  { id:'o1',  name:'Hand-poured Beeswax Candles',  description:'Set of 4 pure beeswax taper candles with cotton wick.',                                               price:24,  category:'Other',      imageUrl:'https://m.media-amazon.com/images/I/619ZOJz3tZL._SX679_.jpg',                                   sellerId:'u1', sellerName:'Wax & Wick'      },
  { id:'o2',  name:'Natural Herbal Soap Bar',       description:'Cold-process soap with lavender, calendula and honey.',                                               price:12,  category:'Other',      imageUrl:'https://m.media-amazon.com/images/I/51N-OR5FGJL._SX522_.jpg',                                   sellerId:'u2', sellerName:'Soap Alchemy'    },
  { id:'o3',  name:'Handmade Paper Stationery Kit', description:'Cotton rag paper notecards and envelopes, 12-piece set.',                                             price:18,  category:'Other',      imageUrl:'https://m.media-amazon.com/images/I/51oGo6EFV4L._SX522_.jpg',                                   sellerId:'u3', sellerName:'Paper & Pen'     },
  { id:'o4',  name:'Dried Botanical Bouquet',       description:'Dried pampas, lunaria, and wildflower arrangement in kraft wrap.',                                    price:32,  category:'Other',      imageUrl:'https://i.etsystatic.com/9637064/r/il/586b12/4609681737/il_570xN.4609681737_is8m.jpg',           sellerId:'u4', sellerName:'Wild & Dry'      },
  { id:'o5',  name:'Wooden Spice Rack',             description:'Hand-crafted bamboo wall-mounted spice rack, holds 12 jars.',                                         price:46,  category:'Other',      imageUrl:'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTBNpWaHIhW3pzec010b_gQMTNAQiDwaiaqz8efCPj28pgrn0gXvWLjfSyE6sPup8uYVbGLHjSwEeIbOZDLVcvLGElWBPHczxjRItCH7SI2kmQ16vneBgPg', sellerId:'u5', sellerName:'Kitchen Craft' },
  { id:'o6',  name:'Leather Bound Recipe Book',     description:'Blank recipe book with handstitched leather cover, 120 pages.',                                       price:54,  category:'Other',      imageUrl:'https://i.etsystatic.com/10322871/r/il/0a16ff/4932047595/il_fullxfull.4932047595_9zh8.jpg',       sellerId:'u6', sellerName:'Bound & Cook'    },
  { id:'o7',  name:'Himalayan Salt Lamp',           description:'Natural pink Himalayan salt chunk with hand-carved wooden base.',                                     price:38,  category:'Other',      imageUrl:'https://m.media-amazon.com/images/I/4146BHwoe7L._SX342_SY445_QL70_FMwebp_.jpg',                 sellerId:'u7', sellerName:'Glow Natural'    },
  { id:'o8',  name:'Handmade Beeswax Wrap Set',     description:'Reusable beeswax food wraps in three sizes, organic cotton.',                                        price:20,  category:'Other',      imageUrl:'https://www.beeswrap.com/cdn/shop/files/Apple_Blossom_1_1500x.png?v=1696339109',                 sellerId:'u8', sellerName:'Eco Wrap Co.'    },
  { id:'o9',  name:'Wool Felted Coasters',          description:'Set of 6 hand-felted merino wool coasters in earthy tones.',                                         price:28,  category:'Other',      imageUrl:'https://m.media-amazon.com/images/I/71fbP4l1mML._SX679_.jpg',                                   sellerId:'u9', sellerName:'Felt & More'     },
  { id:'o10', name:'Personalized Wooden Keychain',  description:'Laser-engraved solid wood keychain with your name or message.',                                      price:15,  category:'Other',      imageUrl:'https://jmprintsph.s3.ap-southeast-1.amazonaws.com/products/9d1c97fe-4f6f-44c8-9483-126160abf4ba.jpg', sellerId:'u10', sellerName:'Key & Wood'  },
];

const now = new Date();
products.forEach((p, i) => {
  const createdAt = new Date(now - i * 3_600_000).toISOString(); // staggered times
  db.insert('products', {
    ...p,
    imageUrls:   [p.imageUrl],
    stock:       Math.floor(Math.random() * 30) + 5,
    tags:        [],
    createdAt,
    updatedAt:   createdAt,
    viewCount:   Math.floor(Math.random() * 500),
    likeCount:   Math.floor(Math.random() * 80),
    rating:      parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
    reviewCount: Math.floor(Math.random() * 40),
    featured:    i < 6,
    deletedAt:   null,
  });
});

console.log(`✅  Seeded ${sellers.length} sellers, 1 buyer, ${products.length} products`);
console.log('\nDemo credentials:');
console.log('  Buyer:  buyer@demo.com / password123');
console.log('  Seller: u1@artisanbazaar.com / password123');
