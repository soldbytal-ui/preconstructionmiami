// Cached and refreshed in the background every 5 minutes.
export const revalidate = 300;
// Pages are generated on first visit, then cached (ISR).
export async function generateStaticParams() {
  return [];
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase, throwIfOutage } from '@/lib/supabase';
import { CARD_COLUMNS } from '@/lib/queries';
import { formatPrice, formatPriceRange, STATUS_LABELS, CATEGORY_LABELS } from '@/lib/utils';
import { generateRealEstateListingSchema, generateBreadcrumbSchema, fitDesc, pickTitle, DEFAULT_OG } from '@/lib/seo';
import Markdown from 'react-markdown';
import StatusBadge from '@/components/projects/StatusBadge';
import InquiryForm from '@/components/projects/InquiryForm';
import FollowButton from '@/components/account/FollowButton';
import ListingHero from '@/components/projects/ListingHero';
import { getSkyline } from '@/lib/skyline';
import ProjectCard from '@/components/projects/ProjectCard';
import SafeImage from '@/components/ui/SafeImage';
import ImageGallery from '@/components/projects/ImageGallery';
import FloorPlans from '@/components/projects/FloorPlans';
import ApprovalStage from '@/components/projects/ApprovalStage';
import { stageFor } from '@/lib/approval-store';
import { localDemo, demoListing } from '@/lib/local-demo';
import ArchitectLinks from '@/components/projects/ArchitectLinks';
import { architectProfileSlugs } from '@/lib/architects';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(name)')
    .eq('slug', slug)
    .single();

  if (!project) return { title: 'Project Not Found' };

  const area = project.neighborhood?.name || 'Miami';
  const n = project.name;
  const title = pickTitle([
    `${n} | Pre-Construction Condos in ${area}`,
    `${n} | Pre-Construction in ${area}`,
    `${n} | New Condos in ${area}`,
    `${n} | Pre-Construction Condos`,
    n,
  ]);
  // Built from the listing's own fields so search results never show a stale storey count or price
  const stage: Record<string, string> = { PRE_LAUNCH: 'planned', PRE_CONSTRUCTION: 'planned', UNDER_CONSTRUCTION: 'under-construction', NEAR_COMPLETION: 'nearly finished', COMPLETED: 'completed' };
  const what = `${project.floors ? `${project.floors}-storey ` : ''}${stage[project.status] || 'new'} condo ${project.floors && project.floors >= 12 ? 'tower' : 'project'}`;
  const description = fitDesc([
    `${project.name} is a ${what} in ${area}${project.developer?.name ? ` by ${project.developer.name}` : ''}.`,
    project.totalUnits ? `${project.totalUnits.toLocaleString()} residences${project.soldOut ? ', sold out' : project.priceMin ? ` from ${formatPrice(project.priceMin)}` : ''}.` : project.priceMin && !project.soldOut ? `From ${formatPrice(project.priceMin)}.` : '',
    project.estCompletion && project.status !== 'COMPLETED' ? `Completion expected ${project.estCompletion}.` : '',
    'Photos, facts and its place on the 3D map.',
  ].filter(Boolean).join(' '), 160);
  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `https://preconstructionmiami.net/properties/${slug}`,
    },
    openGraph: {
      images: DEFAULT_OG,
      title,
      description,
      url: `https://preconstructionmiami.net/properties/${slug}`,
      type: 'website',
      ...(project.mainImageUrl && { images: [{ url: project.mainImageUrl, alt: project.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(project.mainImageUrl && { images: [project.mainImageUrl] }),
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const { data: found, error: loadError } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('slug', slug)
    .single();

  // Local demo only: fictional listings, so new features can be shown without real projects
  const project = found || (localDemo ? demoListing(slug) : null);
  if (!found && !project) throwIfOutage(loadError);
  if (!project) notFound();
  const approval = await stageFor(project.id);
  const architectProfiles = project.architect ? await architectProfileSlugs() : new Set<string>();

  const { data: relatedProjects } = await supabase
    .from('projects')
    .select(CARD_COLUMNS)
    .eq('neighborhoodId', project.neighborhoodId)
    .neq('id', project.id)
    .limit(3);

  // How this project sits among the others in its area, worked out from the listings themselves
  const { data: areaRows } = project.neighborhoodId
    ? await supabase.from('projects').select('id, name, slug, floors, priceMin, status, soldOut, estCompletion').eq('neighborhoodId', project.neighborhoodId)
    : { data: [] as any[] };
  const peers = (areaRows || []) as any[];
  const compare: string[] = [];
  const ord = (k: number) => (k === 1 ? '' : k === 2 ? 'second-' : k === 3 ? 'third-' : `${k}th-`);
  if (project.neighborhood && peers.length > 1) {
    const areaName = project.neighborhood.name;
    // Height rank is only worth stating for the tall end of an area's list
    if (project.floors && project.floors >= 12) {
      const taller = peers.filter((q) => (q.floors || 0) > project.floors).length;
      const tied = peers.filter((q) => q.floors === project.floors).length;
      const top = [...peers].filter((q) => q.floors).sort((a, b) => b.floors - a.floors)[0];
      if (taller === 0 && tied > 1) compare.push(`At ${project.floors} storeys, ${project.name} is one of ${tied} towers tied as the tallest of the ${peers.length} new condo projects we track in ${areaName}.`);
      else if (taller < 5) compare.push(`${project.name} is the ${ord(taller + 1)}tallest of the ${peers.length} new condo projects we track in ${areaName}${taller > 0 && top ? `; the tallest is ${top.name} at ${top.floors} storeys` : ''}.`);
    }
    const priced = peers.filter((q) => q.priceMin && !q.soldOut && q.status !== 'COMPLETED').map((q) => q.priceMin as number).sort((a, b) => a - b);
    if (project.priceMin && !project.soldOut && project.status !== 'COMPLETED' && priced.length > 2) {
      const cheaper = priced.filter((v) => v < project.priceMin).length;
      compare.push(`Its starting price of ${formatPrice(project.priceMin)} is ${cheaper === 0 ? 'the lowest' : cheaper === priced.length - 1 ? 'the highest' : `higher than ${cheaper} and lower than ${priced.length - 1 - cheaper}`} of the ${priced.length} projects in ${areaName} with a published price, which run from ${formatPrice(priced[0])} to ${formatPrice(priced[priced.length - 1])}.`);
    }
    const sameYear = project.estCompletion && project.status !== 'COMPLETED' ? peers.filter((q) => q.id !== project.id && q.estCompletion === project.estCompletion && q.status !== 'COMPLETED') : [];
    if (sameYear.length) compare.push(`${sameYear.length === 1 ? 'One other project' : `${sameYear.length} other projects`} in ${areaName} ${sameYear.length === 1 ? 'is' : 'are'} also due in ${project.estCompletion}: ${sameYear.slice(0, 4).map((q) => q.name).join(', ')}${sameYear.length > 4 ? ' and others' : ''}.`);
  }

  const listingSchema = generateRealEstateListingSchema(project);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://preconstructionmiami.net' },
    { name: 'Properties', url: 'https://preconstructionmiami.net/new-condos' },
    ...(project.neighborhood
      ? [{ name: project.neighborhood.name, url: `https://preconstructionmiami.net/new-condos-${project.neighborhood.slug}` }]
      : []),
    { name: project.name, url: `https://preconstructionmiami.net/properties/${project.slug}` },
  ]);

  // Defensive: amenities may be stored as string, array, or null
  let amenities: string[] = [];
  if (Array.isArray(project.amenities)) {
    amenities = project.amenities;
  } else if (typeof project.amenities === 'string') {
    try { amenities = JSON.parse(project.amenities); } catch { amenities = []; }
  }
  const projectImages = (project.images as any) || {};
  const galleryImages = Array.isArray(projectImages.gallery) ? projectImages.gallery as { url: string; alt?: string; type?: 'rendering' | 'photo' | 'aerial' }[] : [];
  const floorPlanImages = Array.isArray(projectImages.floorPlans) ? projectImages.floorPlans as { url: string; label?: string }[] : [];

  // The 3D tile: this tower with the nearest listed towers from the same area, tallest first
  const skyline = await getSkyline();
  const tower = skyline.find((s) => s.slug === project.slug) || null;
  const around = tower
    ? skyline.filter((s) => s.slug !== tower.slug && s.status !== 'COMPLETED' && s.neighborhoodSlug && s.neighborhoodSlug === tower.neighborhoodSlug).slice(0, 5)
    : [];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-5 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-accent-green transition-colors">Home</Link>
          <span className="text-text-muted/40">/</span>
          <Link href="/new-condos" className="hover:text-accent-green transition-colors">Properties</Link>
          {project.neighborhood && (
            <>
              <span className="text-text-muted/40">/</span>
              <Link href={`/new-condos-${project.neighborhood.slug}`} className="hover:text-accent-green transition-colors">
                {project.neighborhood.name}
              </Link>
            </>
          )}
          <span className="text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">{project.name}</span>
        </nav>

        <div className="mb-10">
          <ListingHero slug={project.slug} name={project.name} status={project.status} soldOut={project.soldOut} main={project.mainImageUrl || null} gallery={galleryImages} tower={tower} around={around} />
          {/* Shown only once the photo source has been confirmed as the developer's own */}
          {projectImages.credit?.confirmed && (
            <p className="mt-2 text-[11px] text-text-muted/60">
              Renderings courtesy of the developer. Images are artist&apos;s conceptual renderings and may differ from the finished building.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={project.status} soldOut={project.soldOut} />
                <span className="text-xs text-text-muted bg-surface2 border border-border px-2.5 py-1 rounded-full">
                  {CATEGORY_LABELS[project.category] || project.category}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl leading-[0.95] tracking-[-0.045em] text-text-primary">{project.name}</h1>
              {project.address && <p className="text-text-muted mt-2">{project.address}</p>}
              {project.developer && (
                <p className="text-text-muted mt-1">
                  by <Link href={`/developers/${project.developer.slug}`} className="text-text-primary font-medium hover:text-accent-green transition-colors">{project.developer.name}</Link>
                </p>
              )}
              <FollowButton projectId={project.id} projectName={project.name} className="mt-4" />
            </div>

            {/* Approval stage: only ever shown with the public record it came from */}
            {project.status !== 'COMPLETED' || approval ? <ApprovalStage record={approval} /> : null}

            {/* Key Specs — 4 glass panels */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Price', value: formatPriceRange(project.priceMin, project.priceMax) },
                { label: 'Total Units', value: project.totalUnits ? `${project.totalUnits} Residences` : 'TBD' },
                { label: 'Floors', value: project.floors ? `${project.floors} Stories` : 'TBD' },
                { label: 'Est. Completion', value: project.estCompletion || 'TBD' },
              ].map((spec) => (
                <div key={spec.label} className="glass-panel rounded-xl p-4">
                  <div className="text-xs text-text-muted uppercase tracking-wider">{spec.label}</div>
                  <div className="text-text-primary font-semibold mt-1">{spec.value}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted/40 -mt-2">Prices shown are approximate and subject to change. Verify with developer or licensed agent.</p>

            {project.unitTypes && (
              <div className="glass-panel rounded-xl p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Unit Types</div>
                <div className="text-text-primary font-medium">{project.unitTypes}</div>
              </div>
            )}

            {project.depositStructure && (
              <div className="bg-accent-green/5 border border-accent-green/20 rounded-xl p-4">
                <div className="text-xs text-accent-green uppercase tracking-wider mb-1">Deposit Structure</div>
                <div className="text-text-primary font-medium">{project.depositStructure}</div>
                <p className="mt-2 text-xs text-text-muted">
                  Before you pay: <Link href="/guides/florida-pre-construction-deposit-protection" className="underline">how deposits are protected</Link>
                  {' · '}<Link href="/guides/florida-condo-15-day-right-to-cancel" className="underline">your 15-day right to cancel</Link>
                  {' · '}<Link href="/guides/reservation-vs-contract-florida-condo" className="underline">reservation vs contract</Link>
                </p>
              </div>
            )}

            {/* Description — single unified content section */}
            {(project.longDescription || project.description) && (
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:text-text-primary prose-headings:font-semibold
                prose-h2:text-lg prose-h2:mt-10 prose-h2:mb-3 prose-h2:pl-4 prose-h2:border-l-[3px] prose-h2:border-accent-green/60
                prose-h3:text-base prose-h3:mt-6 prose-h3:mb-2
                prose-p:text-text-muted prose-p:leading-relaxed prose-p:mb-4
                prose-li:text-text-muted prose-li:leading-relaxed
                prose-strong:text-text-primary prose-strong:font-semibold
                prose-a:text-accent-green prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                prose-hr:border-border prose-hr:my-8
                prose-ul:space-y-1 prose-ul:mb-4
              ">
                <Markdown
                  components={{
                    a: ({ href, children }) => {
                      if (href?.startsWith('/')) {
                        return <a href={href}>{children}</a>;
                      }
                      return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                    },
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold text-text-primary mt-10 mb-3 pl-4 border-l-[3px] border-accent-green/60">{children}</h2>
                    ),
                  }}
                >
                  {project.longDescription || project.description}
                </Markdown>
              </div>
            )}

            {compare.length > 0 && project.neighborhood && (
              <section>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">How it compares in {project.neighborhood.name}</h2>
                <p className="text-text-muted leading-relaxed">{compare.join(' ')}</p>
                <p className="mt-3">
                  <Link href={`/new-condos-${project.neighborhood.slug}`} className="text-sm font-medium text-accent-green link-underline">Compare every new project in {project.neighborhood.name}</Link>
                </p>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {amenities.map((amenity: string) => (
                    <div key={amenity} className="flex items-center gap-2 text-sm text-text-muted">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-green flex-shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            <div id="gallery" className="scroll-mt-24"><ImageGallery images={galleryImages} projectName={project.name} /></div>

            {/* Floor Plans — gated */}
            <FloorPlans floorPlans={floorPlanImages} projectId={project.id} projectName={project.name} />

            {/* Architect */}
            {project.architect && (
              <div className="glass-panel rounded-xl p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Architect</div>
                <div className="text-text-primary font-medium"><ArchitectLinks field={project.architect} profiles={architectProfiles} /></div>
              </div>
            )}

            {/* FAQ Section */}
            {project.faqJson && Array.isArray(project.faqJson) && project.faqJson.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {(project.faqJson as { question: string; answer: string }[]).map((faq, i) => (
                    <details key={i} className="glass-panel rounded-xl group">
                      <summary className="cursor-pointer p-4 flex items-center justify-between text-text-primary font-medium hover:text-accent-green transition-colors">
                        {faq.question}
                        <svg className="w-5 h-5 text-text-muted group-open:rotate-180 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-text-muted leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'FAQPage',
                      mainEntity: (project.faqJson as { question: string; answer: string }[]).map(faq => ({
                        '@type': 'Question',
                        name: faq.question,
                        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                      })),
                    }),
                  }}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24 scroll-mt-24" id="inquire">
              {project.soldOut && (
                <p className="mb-4 rounded-2xl border-2 border-ink bg-surface px-4 py-3 text-sm text-text-primary">
                  <span className="font-semibold">This project is sold out.</span> Use the form to ask about resale units here or similar projects nearby.
                </p>
              )}
              <InquiryForm projectId={project.id} projectName={project.name} />

              {/* Form disclaimer */}
              <p className="text-[10px] text-text-muted/50 mt-3 px-1 leading-relaxed">
                By submitting this form, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-text-muted">Terms of Service</Link> and{' '}
                <Link href="/privacy" className="underline hover:text-text-muted">Privacy Policy</Link>.
                PreConstructionMiami partners with licensed local real estate professionals to assist you.
                We are an informational platform and do not directly participate in real estate transactions.
              </p>

              {/* Neighborhood link */}
              {project.neighborhood && (
                <Link
                  href={`/new-condos-${project.neighborhood.slug}`}
                  className="mt-6 block card p-5 group hover:border-accent-green/30 transition-all"
                >
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Neighborhood</div>
                  <div className="text-text-primary text-lg font-semibold group-hover:text-accent-green transition-colors">
                    {project.neighborhood.name}
                  </div>
                  <div className="text-accent-green text-sm mt-1">View all projects &rarr;</div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Related Projects */}
        {(relatedProjects || []).length > 0 && (
          <div className="mt-20 pt-10 border-t border-border">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              More in {project.neighborhood?.name || 'This Area'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(relatedProjects || []).map((p: any) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
