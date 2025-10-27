import axios from "axios";
import TruliaListing from "../model/trulia.model";
import fs from "fs";
import "dotenv/config";
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

const API_KEY = process.env.API_KEY_SCRAP_BEE;
const BASE_URL = "https://app.scrapingbee.com/api/v1/";

// Test ScrapingBee connection first
const testScrapingBeeConnection = async (): Promise<boolean> => {
    try {
        console.log("🔧 Testing ScrapingBee connection...");
        const testUrl = "https://httpbin.org/html";
        const response = await axios.get(`${BASE_URL}?url=${testUrl}&api_key=${API_KEY}`, {
            timeout: 30000
        });

        if (response.status === 200) {
            console.log("✅ ScrapingBee connection test successful");
            return true;
        } else {
            console.error("❌ ScrapingBee test failed with status:", response.status);
            return false;
        }
    } catch (error: any) {
        console.error("❌ ScrapingBee connection test failed:", error.message);
        return false;
    }
};

// Enhanced Realtors scraper
export async function scrapeRealtors() {
    let allAgents = [];
    let page = 1;
    let hasMore = true;

    // Test connection first
    const connectionOk = await testScrapingBeeConnection();
    if (!connectionOk) {
        console.error("💥 ScrapingBee connection failed. Aborting realtor scraping.");
        return { ai_response: { agents: [], total_realtors: 0 } };
    }

    while (hasMore) {
        try {
            console.log(`🔎 Scraping realtors page ${page}...`);

            const config = {
                method: 'get' as const,
                url: `${BASE_URL}`,
                params: {
                    url: `https://www.realtor.com/realestateagents/agentname-aa/pg-${page}`,
                    api_key: API_KEY,
                    render_js: false,
                    json_response: true,
                    stealth_proxy: true,
                    ai_query: 'Real Estate Agent and Broker Json Parse Data No / or give perfect data as well also one key with total count for REALTORS® found'
                },
                timeout: 60000
            };

            const response = await axios.request(config);

            if (response.status >= 400) {
                console.error(`❌ HTTP ${response.status} error for realtors page ${page}`);
                break;
            }

            // Extract AI response
            let aiResponse = response.data.ai_response;
            let parsed;
            try {
                parsed = JSON.parse(aiResponse);
            } catch (err) {
                console.error("⚠️ Failed to parse ai_response JSON for realtors");
                parsed = { agents: [] };
            }

            // Add agents to list
            if (parsed.agents && parsed.agents.length > 0) {
                allAgents.push(...parsed.agents);
                console.log(`✅ Page ${page}: Found ${parsed.agents.length} agents`);
                page++;

                // Add delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.log(`🏁 No more agents found on page ${page}. Stopping.`);
                hasMore = false;
            }

        } catch (error: any) {
            console.error(`❌ Error scraping realtors page ${page}:`, error.message);
            hasMore = false;
        }
    }

    const finalData = {
        ai_response: {
            agents: allAgents,
            total_realtors: allAgents.length,
        },
    };

    console.log(`🎉 Realtors scraping completed: ${allAgents.length} agents found`);
    return finalData;
}

// Enhanced Trulia scraper
// const websites = [
// "https://www.trulia.com/OH/Delaware/",
// "https://www.trulia.com/DE/Delaware_City/",
// "https://www.trulia.com/AR/Delaware/",
// "https://www.trulia.com/PA/Delaware_Water_Gap/",
// "https://www.trulia.com/MD/",
// "https://www.trulia.com/MD/2_p/",
// "https://www.trulia.com/MD/3_p/",
// "https://www.trulia.com/MD/4_p/",
// "https://www.trulia.com/MD/5_p/",
// "https://www.trulia.com/MD/6_p/",
// "https://www.trulia.com/MD/7_p/",
// "https://www.trulia.com/MD/8_p/",
// "https://www.trulia.com/MD/9_p/",
// "https://www.trulia.com/MD/10_p/",
// "https://www.trulia.com/MD/11_p/",
// "https://www.trulia.com/MD/12_p/",
// "https://www.trulia.com/MD/13_p/",
// "https://www.trulia.com/MD/14_p/",
// "https://www.trulia.com/MD/15_p/",
// "https://www.trulia.com/MD/16_p/",
// "https://www.trulia.com/MD/17_p/",
// "https://www.trulia.com/MD/18_p/",
// "https://www.trulia.com/MD/19_p/",
// "https://www.trulia.com/MD/20_p/",
// "https://www.trulia.com/MD/21_p/",
// "https://www.trulia.com/MD/22_p/",
// "https://www.trulia.com/MD/23_p/",
// "https://www.trulia.com/MD/24_p/",
// "https://www.trulia.com/MD/25_p/",
// "https://www.trulia.com/NY/",
// "https://www.trulia.com/NY/2_p/",
// "https://www.trulia.com/NY/3_p/",
// "https://www.trulia.com/NY/4_p/",
// "https://www.trulia.com/NY/5_p/",
// "https://www.trulia.com/NY/6_p/",
// "https://www.trulia.com/NY/7_p/",
// "https://www.trulia.com/NY/8_p/",
// "https://www.trulia.com/NY/9_p/",
// "https://www.trulia.com/NY/10_p/",
// "https://www.trulia.com/NY/11_p/",
// "https://www.trulia.com/NY/12_p/",
// "https://www.trulia.com/NY/13_p/",
// "https://www.trulia.com/NY/14_p/",
// "https://www.trulia.com/NY/15_p/",
// "https://www.trulia.com/NY/16_p/",
// "https://www.trulia.com/NY/17_p/",
// "https://www.trulia.com/NY/18_p/",
// "https://www.trulia.com/NY/19_p/",
// "https://www.trulia.com/NY/20_p/",
// "https://www.trulia.com/NY/21_p/",
// "https://www.trulia.com/NY/22_p/",
// "https://www.trulia.com/NY/23_p/",
// "https://www.trulia.com/NY/24_p/",
// "https://www.trulia.com/NY/25_p/",
// "https://www.trulia.com/OH/Delaware/",
// "https://www.trulia.com/OH/Delaware/2_p/",
// "https://www.trulia.com/OH/Delaware/3_p/",
// "https://www.trulia.com/OH/Delaware/4_p/",
// "https://www.trulia.com/OH/Delaware/5_p/",
// "https://www.trulia.com/OH/Delaware/6_p/",
// "https://www.trulia.com/OH/Delaware/7_p/",
// "https://www.trulia.com/OH/Delaware/8_p/",
// "https://www.trulia.com/OH/Delaware/9_p/",
// "https://www.trulia.com/OH/Delaware/10_p/",
// "https://www.trulia.com/OH/Delaware/11_p/",
// "https://www.trulia.com/OH/Delaware/12_p/",
// "https://www.trulia.com/OH/Delaware/13_p/",
// "https://www.trulia.com/OH/Delaware/14_p/",
// "https://www.trulia.com/OH/Delaware/15_p/",
// "https://www.trulia.com/OH/Delaware/16_p/",
// "https://www.trulia.com/OH/Delaware/17_p/",
// "https://www.trulia.com/OH/Delaware/18_p/",
// "https://www.trulia.com/OH/Delaware/19_p/",
// "https://www.trulia.com/OH/Delaware/20_p/",
// "https://www.trulia.com/OH/Delaware/21_p/",
// "https://www.trulia.com/OH/Delaware/22_p/",
// "https://www.trulia.com/OH/Delaware/23_p/",
// "https://www.trulia.com/OH/Delaware/24_p/"
// ];

// const websites = [

// ]

//New York country - state-list

// const websites = [
//     // Hamilton County, NY (Pages 1–5)
//     "https://www.trulia.com/County/NY/Hamilton_Real_Estate/",
//     "https://www.trulia.com/County/NY/Hamilton_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Hamilton_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Hamilton_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Hamilton_Real_Estate/5_p/",

//     // Schuyler County, NY (Pages 1–2)
//     "https://www.trulia.com/County/NY/Schuyler_Real_Estate/",
//     "https://www.trulia.com/County/NY/Schuyler_Real_Estate/2_p/",

//     // Yates County, NY (Pages 1–2)
//     "https://www.trulia.com/County/NY/Yates_Real_Estate/",
//     "https://www.trulia.com/County/NY/Yates_Real_Estate/2_p/",

//     // Lewis County, NY (Pages 1–5)
//     "https://www.trulia.com/County/NY/Lewis_Real_Estate/",
//     "https://www.trulia.com/County/NY/Lewis_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Lewis_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Lewis_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Lewis_Real_Estate/5_p/",

//     // Schoharie County, NY (Pages 1–5)
//     "https://www.trulia.com/County/NY/Schoharie_Real_Estate/",
//     "https://www.trulia.com/County/NY/Schoharie_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Schoharie_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Schoharie_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Schoharie_Real_Estate/5_p/",

//     // Seneca County, NY (Pages 1–3)
//     "https://www.trulia.com/County/NY/Seneca_Real_Estate/",
//     "https://www.trulia.com/County/NY/Seneca_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Seneca_Real_Estate/3_p/",

//     // Essex County, NY (Pages 1–12)
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Essex_Real_Estate/12_p/",

//     // Orleans County, NY (Pages 1–3)
//     "https://www.trulia.com/County/NY/Orleans_Real_Estate/",
//     "https://www.trulia.com/County/NY/Orleans_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Orleans_Real_Estate/3_p/",

//     // Wyoming County, NY (Pages 1–2)
//     "https://www.trulia.com/County/NY/Wyoming_Real_Estate/",
//     "https://www.trulia.com/County/NY/Wyoming_Real_Estate/2_p/",

//     // Delaware County, NY (Pages 1–13)
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Delaware_Real_Estate/13_p/",

//     // Cortland County, NY (Pages 1–4)
//     "https://www.trulia.com/County/NY/Cortland_Real_Estate/",
//     "https://www.trulia.com/County/NY/Cortland_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Cortland_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Cortland_Real_Estate/4_p/",

//     // Chenango County, NY (Pages 1–7)
//     "https://www.trulia.com/County/NY/Chenango_Real_Estate/",
//     "https://www.trulia.com/County/NY/Chenango_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Chenango_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Chenango_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Chenango_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Chenango_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Chenango_Real_Estate/7_p/",

//     // Franklin County, NY (Pages 1–9)
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/",
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Franklin_Real_Estate/9_p/",

//     // Allegany County, NY (Pages 1–7)
//     "https://www.trulia.com/County/NY/Allegany_Real_Estate/",
//     "https://www.trulia.com/County/NY/Allegany_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Allegany_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Allegany_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Allegany_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Allegany_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Allegany_Real_Estate/7_p/",

//     // Greene County, NY (Pages 1–19)
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Greene_Real_Estate/19_p/",

//     // Tioga County, NY (Pages 1–5)
//     "https://www.trulia.com/County/NY/Tioga_Real_Estate/",
//     "https://www.trulia.com/County/NY/Tioga_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Tioga_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Tioga_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Tioga_Real_Estate/5_p/",

//     // Montgomery County, NY (Pages 1–5)
//     "https://www.trulia.com/County/NY/Montgomery_Real_Estate/",
//     "https://www.trulia.com/County/NY/Montgomery_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Montgomery_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Montgomery_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Montgomery_Real_Estate/5_p/",

//     // Fulton County, NY (Pages 1–7)
//     "https://www.trulia.com/County/NY/Fulton_Real_Estate/",
//     "https://www.trulia.com/County/NY/Fulton_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Fulton_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Fulton_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Fulton_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Fulton_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Fulton_Real_Estate/7_p/",

//     // Genesee County, NY (Pages 1–3)
//     "https://www.trulia.com/County/NY/Genesee_Real_Estate/",
//     "https://www.trulia.com/County/NY/Genesee_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Genesee_Real_Estate/3_p/",

//     // Herkimer County, NY (Pages 1–9)
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/",
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Herkimer_Real_Estate/9_p/",

//     // Washington County, NY (Pages 1–6)
//     "https://www.trulia.com/County/NY/Washington_Real_Estate/",
//     "https://www.trulia.com/County/NY/Washington_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Washington_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Washington_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Washington_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Washington_Real_Estate/6_p/",

//     // Otsego County, NY (Pages 1–9)
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/",
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Otsego_Real_Estate/9_p/",

//     // Columbia County, NY (Pages 1–16)
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Columbia_Real_Estate/16_p/",

//     // Livingston County, NY (Pages 1–4)
//     "https://www.trulia.com/County/NY/Livingston_Real_Estate/",
//     "https://www.trulia.com/County/NY/Livingston_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Livingston_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Livingston_Real_Estate/4_p/",

//     // Warren County, NY (Pages 1–11)
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Warren_Real_Estate/11_p/",

//     // Madison County, NY (Pages 1–6)
//     "https://www.trulia.com/County/NY/Madison_Real_Estate/",
//     "https://www.trulia.com/County/NY/Madison_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Madison_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Madison_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Madison_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Madison_Real_Estate/6_p/",

//     // Cayuga County, NY (Pages 1–6)
//     "https://www.trulia.com/County/NY/Cayuga_Real_Estate/",
//     "https://www.trulia.com/County/NY/Cayuga_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Cayuga_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Cayuga_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Cayuga_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Cayuga_Real_Estate/6_p/",

//     // Cattaraugus County, NY (Pages 1–11)
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Cattaraugus_Real_Estate/11_p/",

//     // Clinton County, NY (Pages 1–8)
//     "https://www.trulia.com/County/NY/Clinton_Real_Estate/",
//     "https://www.trulia.com/County/NY/Clinton_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Clinton_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Clinton_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Clinton_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Clinton_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Clinton_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Clinton_Real_Estate/8_p/",

//     // Sullivan County, NY (Pages 1–25)
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Sullivan_Real_Estate/25_p/",

//     // Chemung County, NY (Pages 1–9)
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/",
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Chemung_Real_Estate/9_p/",

//     //second column

//     "https://www.trulia.com/County/NY/Wayne_Real_Estate/",
//     "https://www.trulia.com/County/NY/Wayne_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Wayne_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Wayne_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Wayne_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Steuben_Real_Estate/",
//     "https://www.trulia.com/County/NY/Steuben_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Steuben_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Steuben_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Steuben_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Steuben_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Steuben_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Steuben_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Putnam_Real_Estate/",
//     "https://www.trulia.com/County/NY/Putnam_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Putnam_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Putnam_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Putnam_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Putnam_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Putnam_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Putnam_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Tompkins_Real_Estate/",
//     "https://www.trulia.com/County/NY/Tompkins_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Tompkins_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Tompkins_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Tompkins_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Tompkins_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Tompkins_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Tompkins_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Saint_Lawrence_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Ontario_Real_Estate/",
//     "https://www.trulia.com/County/NY/Ontario_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Ontario_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Ontario_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Ontario_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Ontario_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Ontario_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Ontario_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Jefferson_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Oswego_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Chautauqua_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Rensselaer_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Schenectady_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Ulster_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Broome_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Niagara_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Oneida_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Saratoga_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Dutchess_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Albany_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Rockland_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Orange_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Onondaga_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Richmond_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Monroe_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Erie_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Westchester_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Bronx_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Nassau_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Suffolk_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/New_York_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Queens_Real_Estate/25_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/2_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/3_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/4_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/5_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/6_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/7_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/8_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/9_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/10_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/11_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/12_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/13_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/14_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/15_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/16_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/17_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/18_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/19_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/20_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/21_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/22_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/23_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/24_p/",
//     "https://www.trulia.com/County/NY/Kings_Real_Estate/25_p/"
// ];

const websites = [
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Bergen_Real_Estate/25_p/",

    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Middlesex_Real_Estate/25_p/",

    "https://www.trulia.com/County/NJ/Essex_Real_Estate/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Essex_Real_Estate/25_p/",

    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Hudson_Real_Estate/25_p/",

    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Ocean_Real_Estate/25_p/",

    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Monmouth_Real_Estate/25_p/",

    "https://www.trulia.com/County/NJ/Union_Real_Estate/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Union_Real_Estate/21_p/",

    "https://www.trulia.com/County/NJ/Camden_Real_Estate/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Camden_Real_Estate/25_p/",

    "https://www.trulia.com/County/NJ/Morris_Real_Estate/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Morris_Real_Estate/22_p/",

    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Passaic_Real_Estate/22_p/",

    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Burlington_Real_Estate/25_p/",


    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Mercer_Real_Estate/22_p/",

    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Somerset_Real_Estate/17_p/",

    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Gloucester_Real_Estate/20_p/",

    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Atlantic_Real_Estate/25_p/",

    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Cumberland_Real_Estate/14_p/",


    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Sussex_Real_Estate/18_p/",

    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Hunterdon_Real_Estate/20_p/",

    "https://www.trulia.com/County/NJ/Warren_Real_Estate/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Warren_Real_Estate/10_p/",


    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/8_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/9_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/10_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/11_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/12_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/13_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/14_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/15_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/16_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/17_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/18_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/19_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/20_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/21_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/22_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/23_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/24_p/",
    "https://www.trulia.com/County/NJ/Cape_May_Real_Estate/25_p/",


    "https://www.trulia.com/County/NJ/Salem_Real_Estate/",
    "https://www.trulia.com/County/NJ/Salem_Real_Estate/2_p/",
    "https://www.trulia.com/County/NJ/Salem_Real_Estate/3_p/",
    "https://www.trulia.com/County/NJ/Salem_Real_Estate/4_p/",
    "https://www.trulia.com/County/NJ/Salem_Real_Estate/5_p/",
    "https://www.trulia.com/County/NJ/Salem_Real_Estate/6_p/",
    "https://www.trulia.com/County/NJ/Salem_Real_Estate/7_p/",
    "https://www.trulia.com/County/NJ/Salem_Real_Estate/8_p/"
];


export const runTruliaScraper = async () => {
    try {
        console.log("🚀 Starting enhanced Trulia scraper...");

        // Test ScrapingBee connection first
        const scrapingBeeWorking = await testScrapingBeeConnection();

        for (const baseUrl of websites) {
            console.log(`📡 Starting to scrape: ${baseUrl}`);

            let firstPageData = null;
            let retryCount = 0;
            const maxRetries = 3;

            // Try different scraping strategies
            while (!firstPageData && retryCount < maxRetries) {
                try {
                    if (retryCount > 0) {
                        const delay = Math.min(3000 * Math.pow(2, retryCount - 1), 15000);
                        console.log(`⏳ Waiting ${delay}ms before retry ${retryCount}...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }

                    // Strategy 1: Try ScrapingBee first (if working)
                    if (scrapingBeeWorking && retryCount < 2) {
                        console.log(`🔄 Attempt ${retryCount + 1}: Using ScrapingBee API`);
                        firstPageData = await scrapeTruliaWithScrapingBee(baseUrl);
                    }

                    // Strategy 2: Fallback to Puppeteer
                    if (!firstPageData) {
                        console.log(`🔄 Attempt ${retryCount + 1}: Using Puppeteer fallback`);
                        firstPageData = await scrapeTruliaWithPuppeteer(baseUrl);
                    }

                    if (!firstPageData) {
                        retryCount++;
                    }

                } catch (error: any) {
                    console.error(`❌ Error on attempt ${retryCount + 1} for ${baseUrl}:`, error.message);
                    retryCount++;
                }
            }

            if (!firstPageData) {
                console.log(`💥 Failed to get data after ${maxRetries} attempts for: ${baseUrl}`);
                continue;
            }

            const { totalResults, homeLinks: firstPageLinks, actualListings } = firstPageData;

            await saveTruliaListings(baseUrl, firstPageLinks, baseUrl);

            // CORRECTED Pagination logic
            const resultsPerPage = 40; // Trulia shows ~40 listings per page
            const totalPages = Math.ceil(totalResults / resultsPerPage);
            console.log(`📊 Total pages to scrape: ${totalPages} (${totalResults} total results ÷ ${resultsPerPage} per page)`);

            // Scrape remaining pages (limit to reasonable number for testing)
            // const maxPagesToScrape = totalPages;
            // const maxPagesToScrape = totalPages;

            // for (let page = 2; page <= maxPagesToScrape; page++) {

            //     try {
            //         const pageUrl = `${baseUrl}${page}_p/`;
            //         console.log(`📄 Scraping page ${page}/${totalPages}: ${pageUrl}`);

            //         // Use the same strategy that worked for page 1
            //         let pageData = null;
            //         if (scrapingBeeWorking) {
            //             pageData = await scrapeTruliaWithScrapingBee(pageUrl);
            //         } else {
            //             pageData = await scrapeTruliaWithPuppeteer(pageUrl);
            //         }

            //         if (pageData && pageData.homeLinks.length > 0) {
            //             console.log(`🏠 Page ${page}: Found ${pageData.homeLinks.length} links, ${pageData.actualListings} unique listings`);
            //             await saveTruliaListings(baseUrl, pageData.homeLinks, pageUrl);
            //         } else {
            //             console.log(`⚠️ Page ${page}: No data found, might have reached the end`);
            //             break; // Stop if no more data
            //         }

            //         // Add delay between pages to be respectful
            //         await new Promise(resolve => setTimeout(resolve, 3000));

            //     } catch (error: any) {
            //         console.error(`❌ Error scraping page ${page}:`, error.message);
            //         // Continue to next page instead of stopping completely
            //     }
            // }

            console.log("✅ Multi-page scraping completed successfully");
        }

        console.log("🎉 Trulia scraping completed!");

    } catch (error: any) {
        console.error("💥 Fatal error in Trulia scraper:", error.message);
    }
};

// FIXED ScrapingBee strategy
const scrapeTruliaWithScrapingBee = async (pageUrl: string): Promise<{ totalResults: number; homeLinks: string[]; actualListings: number } | null> => {
    try {
        // console.log("🐝 Using ScrapingBee to scrape:", pageUrl);

        const config = {
            method: 'get' as const,
            url: BASE_URL,
            params: {
                url: pageUrl,
                api_key: API_KEY,
                render_js: true,
                wait: 8000,
                stealth_proxy: true,
                window_width: 1920,
                window_height: 1080,
                wait_for: 'networkidle'
            },
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            },
            timeout: 90000
        };

        const response = await axios.request(config);

        if (response.status >= 400) {
            console.error(`💥 ScrapingBee HTTP ${response.status} error: ${response.statusText}`);
            if (response.data) {
                console.error("Error details:", response.data);
            }
            return null;
        }

        const html = response.data;

        // console.log("📄 Received HTML from ScrapingBee", html);

        if (!html || typeof html !== "string" || html.trim() === "") {
            console.log(`⚠️ Invalid HTML content from ScrapingBee`);
            return null;
        }

        // Save for debugging
        fs.writeFileSync("scrapingbee_result.html", html, "utf-8");
        console.log("💾 Saved ScrapingBee HTML result");

        const totalResults = extractTotalResults(html);
        const { homeLinks, actualListings } = extractUniqueHomeLinks(html);

        return { totalResults, homeLinks, actualListings };

    } catch (error: any) {
        console.error("💥 ScrapingBee strategy failed:", {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data ? JSON.stringify(error.response.data).substring(0, 500) : 'No response data'
        });
        return null;
    }
};

// FIXED Puppeteer strategy
const scrapeTruliaWithPuppeteer = async (pageUrl: string): Promise<{ totalResults: number; homeLinks: string[]; actualListings: number } | null> => {
    let browser;
    try {
        console.log("🎭 Using Puppeteer to scrape:", pageUrl);

        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=VizDisplayCompositor',
                '--disable-web-security',
                '--disable-features=site-per-process'
            ]
        });



        const page = await browser.newPage();

        // Set realistic headers and viewport
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        // Additional stealth measures
        await page.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        });

        console.log("🌐 Navigating to page...");
        await page.goto(pageUrl, {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        console.log("⏳ Waiting for page to settle...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        console.log("📜 Auto-scrolling to load content...");
        await autoScroll(page);

        console.log("📄 Extracting HTML content...");
        const html = await page.content();

        // Save for debugging
        fs.writeFileSync("puppeteer_result.html", html, "utf-8");
        console.log("💾 Saved Puppeteer HTML result");

        const totalResults = extractTotalResults(html);
        const { homeLinks, actualListings } = extractUniqueHomeLinks(html);

        console.log(`🎯 Puppeteer results: ${totalResults} total, ${homeLinks.length} links, ${actualListings} unique listings`);

        return { totalResults, homeLinks, actualListings };

    } catch (error: any) {
        console.error("💥 Puppeteer strategy failed:", error.message);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

// FIXED auto-scroll function
async function autoScroll(page: any) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 200;
            const maxScrolls = 50;
            let scrollCount = 0;

            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                scrollCount++;

                if (totalHeight >= scrollHeight || scrollCount >= maxScrolls) {
                    clearInterval(timer);
                    setTimeout(() => resolve(), 1000);
                }
            }, 200);
        });
    });
}

// Enhanced total results extraction
const extractTotalResults = (html: string): number => {
    try {
        console.log("🔍 Extracting total results...");
        const $ = cheerio.load(html);

        // Strategy 1: Look for pagination caption
        const paginationCaption = $('[data-testid="pagination-caption"]');
        if (paginationCaption.length > 0) {
            const captionText = paginationCaption.text().trim();
            console.log(`📊 Pagination caption: "${captionText}"`);

            const resultsMatch = captionText.match(/of\s+(\d+)\s+Results/i);
            if (resultsMatch && resultsMatch[1]) {
                const totalResults = parseInt(resultsMatch[1], 10);
                console.log(`✅ Total results found: ${totalResults}`);
                return totalResults;
            }
        }

        // Strategy 2: Look for results count text patterns
        const allText = $.text();
        const patterns = [
            /(\d+)\s+Results?/i,
            /(\d+)\s+homes?\s+for\s+sale/i,
            /(\d+)\s+properties?/i,
            /showing\s+\d+\s+of\s+(\d+)/i,
            /(\d+)\s+listings?/i
        ];

        for (const pattern of patterns) {
            const match = allText.match(pattern);
            if (match && match[1]) {
                const totalResults = parseInt(match[1], 10);
                console.log(`✅ Total results found (pattern): ${totalResults}`);
                return totalResults;
            }
        }

        // Strategy 3: Count visible listings as fallback
        const listings = $('a[href*="/home/"], a[href*="/builder-community-plan/"]');
        const listingCount = listings.length;
        console.log(`📊 Fallback: Found ${listingCount} visible listings`);

        return listingCount > 0 ? Math.max(listingCount, 40) : 0;

    } catch (error: any) {
        console.error(`💥 Error extracting total results:`, error.message);
        return 0;
    }
};

// CORRECTED: Extract unique home links by property ID
const extractUniqueHomeLinks = (html: string): { homeLinks: string[]; actualListings: number } => {
    const links: string[] = [];
    const uniquePropertyIds = new Set<string>();

    try {
        console.log("🔗 Extracting unique home links...");
        const $ = cheerio.load(html);

        // Find all property links
        const selectors = [
            'a[href*="/home/"]',
            'a[href*="/builder-community-plan/"]'
        ];

        selectors.forEach(selector => {
            const elements = $(selector);
            console.log(`🔍 Selector "${selector}" found ${elements.length} elements`);

            elements.each((index, element) => {
                const href = $(element).attr('href');
                if (href && !href.includes("#") && !href.includes("javascript:")) {
                    // Convert relative URLs to absolute
                    const fullUrl = href.startsWith('http') ? href :
                        href.startsWith('/') ? `https://www.trulia.com${href}` :
                            `https://www.trulia.com/${href}`;

                    if (fullUrl.includes("/home/") || fullUrl.includes("/builder-community-plan/")) {
                        // Extract property ID from URL to deduplicate
                        const propertyIdMatch = fullUrl.match(/\/(\d+)$/);
                        if (propertyIdMatch) {
                            const propertyId = propertyIdMatch[1];

                            if (!uniquePropertyIds.has(propertyId)) {
                                uniquePropertyIds.add(propertyId);
                                links.push(fullUrl);
                            }
                        } else if (!links.includes(fullUrl)) {
                            // Fallback for URLs without clear ID pattern
                            links.push(fullUrl);
                        }
                    }
                }
            });
        });

        const actualListings = uniquePropertyIds.size || links.length;

        console.log(`✅ Found ${links.length} total links, ${actualListings} unique properties`);

        // Validate expected count (should be ~40 per page)
        if (actualListings > 50) {
            console.log(`⚠️ Warning: Found ${actualListings} listings, expected ~40. May include duplicates.`);
        }

        // Log first few links for verification
        if (links.length > 0) {
            console.log("📋 Sample unique links:");
            links.slice(0, 3).forEach((link, idx) => {
                console.log(`  ${idx + 1}. ${link.length > 80 ? link.substring(0, 80) + '...' : link}`);
            });
        }

        return { homeLinks: links, actualListings };

    } catch (error: any) {
        console.error(`💥 Error extracting unique home links:`, error.message);
        return { homeLinks: [], actualListings: 0 };
    }
};

// Enhanced database saving with better error handling
const saveTruliaListings = async (sourceUrl: string, scrapedUrls: string[], scrapedPageUrl: string) => {
    let savedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`💾 Starting to save ${scrapedUrls.length} listings...`);

    if (scrapedUrls.length === 0) {
        console.log("⚠️ No URLs to save");
        return;
    }

    for (const listingUrl of scrapedUrls) {
        try {
            // Validate URL format
            if (!listingUrl || !listingUrl.includes('trulia.com')) {
                console.log(`⚠️ Invalid URL skipped: ${listingUrl}`);
                skippedCount++;
                continue;
            }

            // Check if already exists
            const existing = await TruliaListing.findOne({ listingUrl });
            if (existing) {
                console.log(`🔄 Already exists: ${listingUrl.substring(0, 80)}...`);
                skippedCount++;
                continue;
            }

            // Create new listing
            const newListing = new TruliaListing({
                sourceUrl,
                scrapedUrl: scrapedPageUrl,
                listingUrl,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await newListing.save();
            console.log(`✅ Saved: ${listingUrl.substring(0, 80)}...`);
            savedCount++;

            // Small delay to avoid overwhelming the database
            if (savedCount % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

        } catch (error: any) {
            console.error(`💥 Error saving listing:`, error.message);
            errorCount++;
        }
    }

    console.log(`📊 Save summary: ${savedCount} saved, ${skippedCount} skipped, ${errorCount} errors`);
};

// Export main functions
// export { runTruliaScraper, scrapeRealtors };
