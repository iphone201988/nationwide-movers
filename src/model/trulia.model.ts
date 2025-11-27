import mongoose, { Schema, Document } from 'mongoose';

export interface ITruliaListing extends Document {
  sourceUrl: string; // The base URL that was scraped (e.g., https://www.trulia.com/OH/Delaware/)
  scrapedUrl: string; // The URL that was scraped (e.g., https://www.trulia.com/OH/Delaware/2_p/)
  listingUrl: string; // The actual property listing URL (e.g., https://www.trulia.com/p/OH/Delaware/123-Main-St)
  createdAt: Date;
  updatedAt: Date;
  isScraped: boolean; // Flag to indicate if detailed scraping has been done
  priority: number; // Priority for scraping order
}

const truliaListingSchema = new Schema<ITruliaListing>({
  sourceUrl: { type: String, required: true, index: true },
  scrapedUrl: { type: String, required: true, trim: true, index: true },
  listingUrl: { type: String, required: true, trim: true, index: true },
  isScraped: { type: Boolean, default: false },
  priority: { type: Number, default: 0 },
}, {
  timestamps: true
});
truliaListingSchema.index({ sourceUrl: 1, scrapedUrl: 1, listingUrl: 1 }, { unique: true });
truliaListingSchema.index({ isScraped: 1, priority: -1, createdAt: 1 });
truliaListingSchema.index({ createdAt: -1 })
truliaListingSchema.index({ priority: -1 });

export const TruliaListing = mongoose.model<ITruliaListing>('TruliaListing', truliaListingSchema);
export default TruliaListing;