// Column lists shared by pages, so list views fetch only what a card needs
// instead of every project's full write-up, FAQ and gallery.
export const CARD_COLUMNS =
  'id, slug, name, status, soldOut, category, priceMin, priceMax, totalUnits, floors, estCompletion, mainImageUrl, neighborhoodId, developerId, featured, neighborhood:neighborhoods(name, slug), developer:developers(name, slug)';
