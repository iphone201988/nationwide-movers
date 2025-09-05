import express from "express";
import dotenv from "dotenv";
import colors from "colors";
import morgan from "morgan";
import connectToMongoDB from "./src/config/Db";
import * as path from "path";
import { runTruliaScraper } from "./src/service/scapping";
import { loadLocalHtmlWithPuppeteer, scrapWithScrapingBee } from "./src/service/details.scarpping";
import TruliaListing from "./src/model/trulia.model";
import router from "./src/route";

dotenv.config();

connectToMongoDB();

const app = express();

app.use(express.json());
app.use(morgan("dev"));


// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', router);

app.get("/", (req, res) => {
    res.send("API is running 🚀");
});

// Serve the test upload page
app.get("/test-upload", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'test-upload.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(colors.yellow.bgBlack("Server running on ") +
        colors.cyan.underline.bgBlack(`http://localhost:${PORT}`));
});

//Main function to run the scraper
// runTruliaScraper();

(async () => {
    const alltruliaLisitng = await TruliaListing.find({ isScraped: false });
    for (const listing of alltruliaLisitng) {
        const pageUrl = listing.listingUrl;

        const localFile = await scrapWithScrapingBee(pageUrl);
        if (localFile !== null) {
            await loadLocalHtmlWithPuppeteer(localFile);
            listing.isScraped = true;
            await listing.save();
            console.log("✅ Scraped and updated:", listing.listingUrl);
        } else {
            console.log("❌ Failed to scrape:", listing.listingUrl);
        }
    }
})();

//       const pageUrl = "https://www.trulia.com/home/39-coldstone-ct-delaware-oh-43015-456301031"; // 👈 your target URL
//       const pageUrl = "https://www.trulia.com/builder-community-plan/stockdale-farms-charles-2059112312";
//       const pageUrl = "https://www.trulia.com/home/490-penwell-dr-delaware-oh-43015-454942659"; 