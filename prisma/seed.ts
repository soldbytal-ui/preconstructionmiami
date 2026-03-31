import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr || priceStr === '--' || priceStr === 'TBD' || priceStr === 'N/A') return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  // Handle "From $2M" vs "From $2,000,000"
  if (priceStr.toLowerCase().includes('m') && num < 1000) return Math.round(num * 1_000_000);
  if (priceStr.toLowerCase().includes('k') && num < 100_000) return Math.round(num * 1000);
  return Math.round(num);
}

function parseStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s.includes('pre-launch') || s.includes('pre launch')) return 'PRE_LAUNCH';
  if (s.includes('near completion') || s.includes('nearly complete')) return 'NEAR_COMPLETION';
  if (s.includes('under construction')) return 'UNDER_CONSTRUCTION';
  if (s.includes('completed') || s.includes('complete')) return 'COMPLETED';
  return 'PRE_CONSTRUCTION';
}

function parseCategory(cat: string): string {
  const c = cat.toLowerCase().trim();
  if (c.includes('ultra')) return 'ULTRA_LUXURY';
  if (c.includes('branded')) return 'LUXURY_BRANDED';
  if (c.includes('affordable')) return 'AFFORDABLE_LUXURY';
  if (c.includes('premium')) return 'PREMIUM';
  if (c.includes('luxury')) return 'LUXURY';
  return 'PREMIUM';
}

function parseInt2(s: string): number | null {
  const n = parseInt(s.replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

// --- Neighborhoods data ---
const NEIGHBORHOODS = [
  { name: 'Brickell', slug: 'brickell', region: 'Miami', displayOrder: 1, avgPriceStudio: 400000, avgPrice1br: 550000, avgPrice2br: 900000, avgPrice3br: 1500000, avgPricePenthouse: 5000000, description: 'Brickell is Miami\'s financial district and one of the densest urban neighborhoods in the southeastern United States. Often called the "Manhattan of the South," Brickell is home to gleaming high-rises, international banks, upscale restaurants, and a vibrant nightlife scene along Brickell Avenue.\n\nThe neighborhood has seen an explosion of luxury pre-construction development, with over 20 active projects ranging from branded residences like Dolce & Gabbana (888 Brickell) and Cipriani to ultra-luxury towers like Baccarat Residences. Brickell appeals to young professionals, international investors, and anyone seeking a walkable urban lifestyle with world-class amenities.\n\nWith the Brickell City Centre shopping complex, proximity to Key Biscayne, and easy access to I-95 and the Metromover, Brickell offers the rare combination of urban convenience and tropical living.' },
  { name: 'Miami Beach', slug: 'miami-beach', region: 'Miami Beach', displayOrder: 2, avgPriceStudio: 700000, avgPrice1br: 1200000, avgPrice2br: 2500000, avgPrice3br: 5000000, avgPricePenthouse: 15000000, description: 'Miami Beach is an iconic barrier island destination known worldwide for its pristine oceanfront, Art Deco architecture, and luxury lifestyle. The area encompasses South Beach, Mid-Beach, and North Beach, each with its own distinct character.\n\nPre-construction in Miami Beach tends toward ultra-luxury, with branded residences like The Perigon, Aman Miami Beach, Ritz-Carlton South Beach, and Shore Club Private Collection commanding premium prices. The limited supply of oceanfront land makes Miami Beach one of the most desirable -- and expensive -- pre-construction markets in South Florida.\n\nBuyers here are drawn by the beach lifestyle, world-class dining on Lincoln Road and Collins Avenue, proximity to the Design District, and the prestige of a Miami Beach address.' },
  { name: 'Downtown Miami', slug: 'downtown-miami', region: 'Miami', displayOrder: 3, avgPriceStudio: 350000, avgPrice1br: 500000, avgPrice2br: 800000, avgPrice3br: 1100000, avgPricePenthouse: 3000000, description: 'Downtown Miami is the urban core of the city, anchored by landmarks like Bayfront Park, the Adrienne Arsht Center, and the AmericanAirlines Arena. Once primarily a business district, Downtown has transformed into a thriving residential neighborhood with some of Miami\'s most ambitious pre-construction projects.\n\nNotable developments include the Waldorf Astoria Residences (set to be the tallest tower south of New York at 100 stories), E11EVEN Hotel & Residences, Delano Residences, and the Okan Tower. Downtown offers some of the best value in urban Miami, with prices significantly below neighboring Brickell while offering similar walkability and access.\n\nThe area benefits from the Brightline high-speed rail station connecting to Fort Lauderdale and West Palm Beach, plus easy access to the Design District, Wynwood, and the beaches.' },
  { name: 'Edgewater', slug: 'edgewater', region: 'Miami', displayOrder: 4, avgPriceStudio: 500000, avgPrice1br: 750000, avgPrice2br: 1200000, avgPrice3br: 2000000, avgPricePenthouse: 4800000, description: 'Edgewater is a waterfront neighborhood on Biscayne Bay that has emerged as one of Miami\'s hottest pre-construction markets. Located between Downtown and the Design District, Edgewater offers stunning bay views, a quieter residential feel, and excellent value compared to Brickell and Miami Beach.\n\nThe neighborhood is anchored by the massive Aria Reserve twin towers (62 stories each) and has attracted developments like EDITION Residences, Villa Miami by Terra, and Missoni Baia. Edgewater\'s appeal lies in its bay views, proximity to the Design District and Wynwood, and prices that are typically 20-30% below comparable Brickell units.\n\nMargaret Pace Park and the Biscayne Bay waterfront provide green space and recreation, while the neighborhood\'s central location makes it easy to access all of Miami\'s key areas.' },
  { name: 'Sunny Isles Beach', slug: 'sunny-isles-beach', region: 'Miami-Dade', displayOrder: 5, avgPriceStudio: 2000000, avgPrice1br: 3500000, avgPrice2br: 5500000, avgPrice3br: 8000000, avgPricePenthouse: 20000000, description: 'Sunny Isles Beach is an ultra-luxury oceanfront enclave between Miami Beach and Fort Lauderdale. Known as "Little Moscow" for its large Russian-speaking community, Sunny Isles has become synonymous with branded ultra-luxury high-rises.\n\nThe two marquee pre-construction projects are the St. Regis Residences (62 floors, from $5.5M) and Bentley Residences (from $5.6M, the tallest oceanfront building in the US at 749 feet). These developments cater to ultra-high-net-worth buyers seeking absolute oceanfront living with five-star hotel services.\n\nSunny Isles offers direct beach access, proximity to Aventura Mall and Bal Harbour Shops, and a quiet residential atmosphere compared to the bustle of Miami Beach.' },
  { name: 'Coconut Grove', slug: 'coconut-grove', region: 'Miami', displayOrder: 6, avgPriceStudio: 800000, avgPrice1br: 1200000, avgPrice2br: 2500000, avgPrice3br: 4000000, avgPricePenthouse: 8000000, description: 'Coconut Grove is Miami\'s oldest neighborhood, known for its lush tropical canopy, village atmosphere, and waterfront parks. "The Grove" offers a distinct alternative to the high-rise urban lifestyle of Brickell and Downtown, with a focus on family-friendly living and natural beauty.\n\nPre-construction here includes Four Seasons Private Residences, THE WELL by Related, Vita at Grove Isle, and several boutique developments. The neighborhood attracts families, professionals, and anyone seeking a more relaxed pace while still being minutes from Downtown Miami.\n\nCoCoWalk, the Grove\'s revamped retail center, anchors the village core, while Peacock Park, Kennedy Park, and the Biscayne Bay waterfront provide abundant outdoor recreation.' },
  { name: 'Surfside', slug: 'surfside', region: 'Miami-Dade', displayOrder: 7, avgPriceStudio: 1500000, avgPrice1br: 3000000, avgPrice2br: 5000000, avgPrice3br: 8000000, avgPricePenthouse: 12000000, description: 'Surfside is a small, quiet beach town nestled between Miami Beach and Bal Harbour. It offers an exclusive, boutique-scale alternative to the larger developments in neighboring areas, with a strong community feel and direct ocean access.\n\nPre-construction projects include the Surf House at Surf Club (a Four Seasons property), the Delmore by Zaha Hadid Architects, and Arte Surfside by Antonio Citterio. These ultra-luxury developments are intimate in scale, with few units and premium finishes.\n\nSurfside appeals to buyers seeking privacy, low-density living, and walkable beach access while remaining close to the restaurants and shops of Bal Harbour.' },
  { name: 'Hollywood', slug: 'hollywood', region: 'Broward', displayOrder: 8, avgPriceStudio: 350000, avgPrice1br: 500000, avgPrice2br: 800000, avgPrice3br: 1200000, description: 'Hollywood offers a more relaxed, value-oriented beachfront lifestyle compared to Miami Beach. The famous Hollywood Beach Broadwalk stretches 2.5 miles along the Atlantic, lined with cafes, restaurants, and shops.\n\nPre-construction developments like Solemar Residences and Hyde Resort offer oceanfront or near-ocean living at prices significantly below Miami Beach. Hollywood appeals to families, retirees, and investors seeking rental income from the steady flow of beachgoers.\n\nWith easy access to Fort Lauderdale, Aventura Mall, and both Miami and Fort Lauderdale airports, Hollywood provides an excellent balance of lifestyle and value.' },
  { name: 'Aventura', slug: 'aventura', region: 'Miami-Dade', displayOrder: 9, avgPriceStudio: 500000, avgPrice1br: 700000, avgPrice2br: 1200000, avgPrice3br: 2000000, description: 'Aventura is a planned suburban-luxury community anchored by the world-renowned Aventura Mall, one of the largest shopping centers in the US. The city offers a family-friendly atmosphere with excellent schools, parks, and a mix of high-rise and low-rise living.\n\nPre-construction projects include Viceroy Residences and Avenia by Fendi Casa, both bringing luxury branded living to the area. Aventura appeals to families, international buyers, and those seeking a quieter lifestyle with easy access to both Miami Beach and Fort Lauderdale.' },
  { name: 'Midtown/Wynwood', slug: 'midtown-wynwood', region: 'Miami', displayOrder: 10, avgPriceStudio: 350000, avgPrice1br: 500000, avgPrice2br: 800000, avgPrice3br: 1200000, description: 'Midtown and Wynwood form Miami\'s creative epicenter, home to the world-famous Wynwood Walls street art, an explosion of galleries, craft breweries, restaurants, and boutiques. The area has seen rapid gentrification and is now one of the fastest-appreciating neighborhoods in Miami.\n\nPre-construction projects here tend toward modern, design-forward developments at relatively accessible price points compared to Brickell or Miami Beach. The neighborhood attracts young professionals, creatives, and investors looking to capitalize on the area\'s continued growth.\n\nWynwood\'s monthly Art Walk events, proximity to the Design District, and vibrant nightlife scene make it one of Miami\'s most culturally dynamic neighborhoods.' },
  { name: 'Coral Gables', slug: 'coral-gables', region: 'Miami-Dade', displayOrder: 11, avgPriceStudio: 500000, avgPrice1br: 750000, avgPrice2br: 1200000, avgPrice3br: 1800000, description: 'Coral Gables, known as "The City Beautiful," is an established, affluent community featuring Mediterranean Revival architecture, tree-lined streets, and the iconic Biltmore Hotel. The city has strict zoning and architectural standards, resulting in a more refined, less high-rise development pattern.\n\nPre-construction projects include Villa Valencia, Alina Residences, and Alhambra Parc, offering a more intimate luxury experience compared to the towers of Brickell. Coral Gables appeals to families and professionals who value walkable retail on Miracle Mile, proximity to the University of Miami, and a strong sense of community.' },
  { name: 'Fort Lauderdale', slug: 'fort-lauderdale', region: 'Broward', displayOrder: 12, avgPriceStudio: 900000, avgPrice1br: 1500000, avgPrice2br: 2500000, avgPrice3br: 4000000, avgPricePenthouse: 10000000, description: 'Fort Lauderdale has emerged as a serious alternative to Miami for luxury pre-construction, offering lower prices, less density, and a more laid-back atmosphere. The city\'s beachfront is undergoing a transformation with several high-profile developments.\n\nNotable pre-construction projects include Four Seasons Hotel and Private Residences, EDITION Residences Fort Lauderdale, and Pier Sixty-Six. These developments bring Miami-level luxury to Fort Lauderdale\'s prime oceanfront and Intracoastal locations.\n\nWith its own international airport, proximity to Port Everglades, and easy access to Miami via I-95 and the Brightline, Fort Lauderdale offers a compelling combination of value and lifestyle.' },
  { name: 'Bal Harbour', slug: 'bal-harbour', region: 'Miami-Dade', displayOrder: 13, avgPriceStudio: 3000000, avgPrice1br: 5000000, avgPrice2br: 8000000, avgPrice3br: 12000000, description: 'Bal Harbour is one of South Florida\'s most exclusive enclaves, home to the legendary Bal Harbour Shops and some of the most expensive oceanfront real estate in the region.\n\nThe marquee pre-construction project is Rivage Bal Harbour, an ultra-luxury development commanding premium prices. Bal Harbour appeals to ultra-high-net-worth buyers seeking exclusivity, privacy, and proximity to world-class shopping and dining.' },
  { name: 'Key Biscayne', slug: 'key-biscayne', region: 'Miami-Dade', displayOrder: 14, avgPriceStudio: 1000000, avgPrice1br: 1500000, avgPrice2br: 2500000, avgPrice3br: 4000000, description: 'Key Biscayne is an island paradise just minutes from Downtown Miami, accessible via the Rickenbacker Causeway. Known for its pristine beaches, top-rated parks (Crandon Park, Bill Baggs), and family-friendly atmosphere, Key Biscayne offers an exclusive island lifestyle.\n\nPre-construction opportunities here are rare due to limited land, making new developments like Silver Sands Residences particularly desirable. Key Biscayne appeals to families and affluent buyers seeking a quiet, nature-surrounded lifestyle within easy reach of Miami\'s urban core.' },
  { name: 'Bay Harbor Islands', slug: 'bay-harbor-islands', region: 'Miami-Dade', displayOrder: 15, avgPriceStudio: 600000, avgPrice1br: 900000, avgPrice2br: 1500000, avgPrice3br: 2000000, description: 'Bay Harbor Islands is a quiet, two-island residential community between Miami Beach and Aventura. It has become a hotspot for boutique pre-construction development, with nearly a dozen active projects including 9900 West, Origin Residences, THE WELL, and La Mare.\n\nThe area offers a village-like atmosphere with walkable shops and restaurants on Kane Concourse, proximity to Bal Harbour Shops, and waterfront living on Biscayne Bay. Bay Harbor Islands appeals to buyers seeking intimate, low-rise luxury away from the high-rise density of Miami Beach.' },
  { name: 'Palm Beach', slug: 'palm-beach', region: 'Palm Beach', displayOrder: 16, avgPriceStudio: 2000000, avgPrice1br: 3500000, avgPrice2br: 6000000, avgPrice3br: 10000000, description: 'Palm Beach is Florida\'s most prestigious address, synonymous with old-money wealth, Worth Avenue shopping, and manicured oceanfront estates. Pre-construction here is extremely limited, with new developments like Alba Palm Beach commanding ultra-premium pricing.\n\nWest Palm Beach, just across the Intracoastal, has emerged as a dynamic urban alternative with a growing tech and finance scene. The Brightline rail connection makes it easy to commute to Fort Lauderdale and Miami, attracting a younger demographic alongside Palm Beach\'s traditional clientele.' },
];

async function seedNeighborhoods() {
  console.log('Seeding neighborhoods...');
  for (const n of NEIGHBORHOODS) {
    await prisma.neighborhood.upsert({
      where: { slug: n.slug },
      update: { ...n },
      create: { ...n },
    });
  }
  console.log(`  ✓ ${NEIGHBORHOODS.length} neighborhoods seeded`);
}

async function seedProjects() {
  console.log('Seeding projects from database file...');

  const dbPath = path.join(__dirname, '../../assignrate/south-florida-precon-database.md');
  if (!fs.existsSync(dbPath)) {
    console.log('  ⚠ Project database file not found, skipping');
    return;
  }

  const content = fs.readFileSync(dbPath, 'utf-8');
  const neighborhoodMap = await getNeighborhoodMap();
  const developerCache: Record<string, string> = {};
  let projectCount = 0;

  // Split by ## headers to get neighborhood sections
  const sections = content.split(/^## /m).filter((s) => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    const sectionTitle = lines[0].trim().replace(/[#*]/g, '').trim();

    // Find table rows (lines starting with |, skip header/separator)
    const tableRows = lines.filter(
      (l) => l.startsWith('|') && !l.includes('---') && !l.toLowerCase().includes('project name')
    );

    for (const row of tableRows) {
      const cols = row
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);
      if (cols.length < 5) continue;

      const name = cols[0].replace(/\*\*/g, '').trim();
      if (!name || name.toLowerCase().includes('project name')) continue;

      const address = cols[1] && cols[1] !== '--' ? cols[1] : null;
      const developerName = cols[2] && cols[2] !== '--' ? cols[2].trim() : null;
      const architect = cols[3] && cols[3] !== '--' ? cols[3].trim() : null;
      const status = cols[4] ? parseStatus(cols[4]) : 'PRE_CONSTRUCTION';
      const estCompletion = cols[5] && cols[5] !== '--' ? cols[5].trim() : null;
      const totalUnits = cols[6] ? parseInt2(cols[6]) : null;
      const floors = cols[7] ? parseInt2(cols[7]) : null;
      const priceRange = cols[8] || '';
      const category = cols[9] ? parseCategory(cols[9]) : 'PREMIUM';

      const priceMin = parsePrice(priceRange);
      const slug = slugify(name);

      // Resolve neighborhood
      let neighborhoodId: string | null = null;
      const sectionLower = sectionTitle.toLowerCase();
      for (const [nSlug, nId] of Object.entries(neighborhoodMap)) {
        if (sectionLower.includes(nSlug.replace(/-/g, ' ')) || sectionLower.includes(nSlug.replace(/-/g, ''))) {
          neighborhoodId = nId;
          break;
        }
      }

      // Resolve developer
      let developerId: string | null = null;
      if (developerName) {
        if (!developerCache[developerName]) {
          const devSlug = slugify(developerName);
          const dev = await prisma.developer.upsert({
            where: { slug: devSlug },
            update: {},
            create: { name: developerName, slug: devSlug },
          });
          developerCache[developerName] = dev.id;
        }
        developerId = developerCache[developerName];
      }

      try {
        await prisma.project.upsert({
          where: { slug },
          update: {
            name, address, neighborhoodId, developerId, architect,
            status: status as any, estCompletion, totalUnits, floors,
            priceMin, category: category as any,
          },
          create: {
            name, slug, address, neighborhoodId, developerId, architect,
            status: status as any, estCompletion, totalUnits, floors,
            priceMin, category: category as any,
          },
        });
        projectCount++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          // Duplicate slug, append a suffix
          const newSlug = `${slug}-2`;
          await prisma.project.upsert({
            where: { slug: newSlug },
            update: { name, neighborhoodId, developerId },
            create: {
              name, slug: newSlug, address, neighborhoodId, developerId, architect,
              status: status as any, estCompletion, totalUnits, floors,
              priceMin, category: category as any,
            },
          });
          projectCount++;
        }
      }
    }
  }

  // Mark some as featured
  const flagships = ['baccarat-residences-miami', 'cipriani-residences-miami', 'waldorf-astoria-residences-miami', 'aria-reserve', 'the-perigon', 'four-seasons-fort-lauderdale'];
  for (const slug of flagships) {
    await prisma.project.updateMany({ where: { slug: { contains: slug.split('-')[0] } }, data: { featured: true } });
  }
  // More targeted featured updates
  await prisma.project.updateMany({ where: { name: { contains: 'Baccarat' } }, data: { featured: true } });
  await prisma.project.updateMany({ where: { name: { contains: 'Cipriani' } }, data: { featured: true } });
  await prisma.project.updateMany({ where: { name: { contains: 'Waldorf' } }, data: { featured: true } });
  await prisma.project.updateMany({ where: { name: { contains: 'E11EVEN' } }, data: { featured: true } });
  await prisma.project.updateMany({ where: { name: { contains: 'Perigon' } }, data: { featured: true } });
  await prisma.project.updateMany({ where: { name: { contains: 'Four Seasons' } }, data: { featured: true } });

  console.log(`  ✓ ${projectCount} projects seeded`);
}

async function seedBlogPosts() {
  console.log('Seeding blog posts...');

  const blogPath = path.join(__dirname, '../../assignrate/preconstructionmiami-blog-posts-2026.md');
  if (!fs.existsSync(blogPath)) {
    console.log('  ⚠ Blog posts file not found, skipping');
    return;
  }

  const content = fs.readFileSync(blogPath, 'utf-8');
  // Split by post separators
  const posts = content.split(/={3,}\s*POST\s*(BREAK|[0-9]+)\s*={3,}/i).filter((s) => s.trim().length > 100);

  let count = 0;
  for (const postContent of posts) {
    // Extract metadata
    const titleMatch = postContent.match(/^#\s+(.+?)$/m);
    const metaTitleMatch = postContent.match(/\*\*Meta Title\*\*:\s*(.+)/i) || postContent.match(/Meta Title:\s*(.+)/i);
    const metaDescMatch = postContent.match(/\*\*Meta Description\*\*:\s*(.+)/i) || postContent.match(/Meta Description:\s*(.+)/i);
    const keywordMatch = postContent.match(/\*\*Target Keyword\*\*:\s*(.+)/i) || postContent.match(/Target Keyword:\s*(.+)/i);
    const slugMatch = postContent.match(/\*\*Slug\*\*:\s*\/blog\/(.+)/i) || postContent.match(/Slug:\s*\/blog\/(.+)/i) || postContent.match(/\*\*Slug\*\*:\s*(.+)/i);

    const title = titleMatch?.[1]?.replace(/\*\*/g, '').trim();
    if (!title) continue;

    const slug = slugMatch?.[1]?.trim() || slugify(title);
    const metaTitle = metaTitleMatch?.[1]?.replace(/"/g, '').trim();
    const metaDescription = metaDescMatch?.[1]?.replace(/"/g, '').trim();
    const targetKeyword = keywordMatch?.[1]?.replace(/"/g, '').trim();

    // Extract the main content (everything after the metadata block)
    let bodyContent = postContent;
    // Remove metadata lines at the top
    bodyContent = bodyContent.replace(/^\*\*(Meta Title|Meta Description|Target Keyword|Slug)\*\*:.*$/gim, '');
    bodyContent = bodyContent.replace(/^(Meta Title|Meta Description|Target Keyword|Slug):.*$/gim, '');
    bodyContent = bodyContent.trim();

    // Generate excerpt from first paragraph after the title
    const paragraphs = bodyContent.split('\n\n').filter((p) => p.trim() && !p.startsWith('#') && !p.startsWith('*'));
    const excerpt = paragraphs[0]?.replace(/[#*_]/g, '').trim().slice(0, 300);

    try {
      await prisma.blogPost.upsert({
        where: { slug },
        update: { title, content: bodyContent, metaTitle, metaDescription, targetKeyword, excerpt },
        create: {
          title, slug, content: bodyContent, metaTitle, metaDescription,
          targetKeyword, excerpt, publishedAt: new Date(),
          author: 'PreConstructionMiami.net',
        },
      });
      count++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        console.log(`  ⚠ Duplicate slug: ${slug}, skipping`);
      } else {
        console.error(`  ✗ Error seeding post "${title}":`, e.message);
      }
    }
  }
  console.log(`  ✓ ${count} blog posts seeded`);
}

async function getNeighborhoodMap(): Promise<Record<string, string>> {
  const neighborhoods = await prisma.neighborhood.findMany({ select: { id: true, slug: true } });
  const map: Record<string, string> = {};
  for (const n of neighborhoods) {
    map[n.slug] = n.id;
    // Also add without hyphens for matching
    map[n.slug.replace(/-/g, '')] = n.id;
  }
  return map;
}

async function main() {
  console.log('🌴 Starting PreConstructionMiami seed...\n');
  await seedNeighborhoods();
  await seedProjects();
  await seedBlogPosts();
  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
