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
import errorHandler from "./src/utils/error";
import Realtor from "./src/model/realtor.model";
import Agent from "./src/model/agent.model";
import { getLatLngFromAddress } from "./src/service/googleMap.service";
import Listing from "./src/model/listing.model";

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

app.post("/uplode-data", async (req, res) => {
    try {
        const RealtorData = await Realtor.find();

        for (const realtor of RealtorData) {
            const { fullName, phoneNumber, rawData } = realtor
            if (!fullName || !phoneNumber) continue;

            const address = rawData?.["**Paste+Address**"] || null;

            await Agent.create({
                fullName,
                phoneNumber,
                address,
            });
            realtor.isDataSaved = true;
            await realtor.save();
        }
        res.status(200).json({ success: true, message: "Data uploaded successfully" });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Unknown error",
        });
    }
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

app.use(errorHandler);

app.use(
  "/uploads",
  express.static(path.resolve(path.join(__dirname, "../src/uploads")))
);


//Main function to run the scraper
// runTruliaScraper();

// (async () => {
//     const alltruliaLisitng = await TruliaListing.find({ isScraped: false });
//     for (const listing of alltruliaLisitng) {
//         const pageUrl = listing.listingUrl;

//         const localFile = await scrapWithScrapingBee(pageUrl);
//         if (localFile !== null) {
//             await loadLocalHtmlWithPuppeteer(localFile);
//             listing.isScraped = true;
//             await listing.save();
//             console.log("✅ Scraped and updated:", listing.listingUrl);
//         } else {
//             console.log("❌ Failed to scrape:", listing.listingUrl);
//         }
//     }
// })();

//       const pageUrl = "https://www.trulia.com/home/39-coldstone-ct-delaware-oh-43015-456301031"; // 👈 your target URL
//       const pageUrl = "https://www.trulia.com/builder-community-plan/stockdale-farms-charles-2059112312";
//       const pageUrl = "https://www.trulia.com/home/490-penwell-dr-delaware-oh-43015-454942659"; 


// (async () => {
//   try {
//     const location = await getLatLngFromAddress("F-363, Phase 8B, Industrial Area, Sector 74, Sahibzada Ajit Singh Nagar, Punjab 160071");
//     console.log(location); // { lat: 12.9715987, lng: 77.5945627 }
//   } catch (err) {
//     console.error(err.message);
//   }
// })();


// const updateAgents = async () => {
//   try {
//     const agents = await Agent.find({ timeZone: { $exists: false } });

//     let updatedCount = 0;

//     for (const agent of agents) {
//       // Find the most recent listing with a valid address
//       const listing = await Listing.findOne({
//         agentId: agent._id,
//         address: { $exists: true, $ne: "" }
//       }).sort({ createdAt: -1 });

//       if (!listing) {
//         console.log(`⚠️ No listing found with address for agent ${agent._id}`);
//         continue;
//       }

//       try {
//         const result = await getLatLngFromAddress(listing.address);
//         if (result) {
//           agent.lat = result.lat;
//           agent.lng = result.lng;
//           agent.timeZone = result.timeZoneId;     // e.g. "Asia/Kolkata"
//           await agent.save();
//           updatedCount++;
//           console.log(`✅ Updated agent ${agent._id} with timezone ${result.timeZoneId}`);
//         }
//       } catch (geoErr) {
//         console.warn(`⚠️ Failed to geocode for agent ${agent._id}:`, geoErr.message);
//       }
//     }

//     console.log(`🎉 All agents processed. Total updated: ${updatedCount}/${agents.length}`);
//   } catch (error) {
//     console.error("💥 Error in updateAgents:", error);
//   }
// };

// updateAgents();
