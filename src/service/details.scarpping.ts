import axios from "axios";
import fs from "fs";
import puppeteer from "puppeteer";
import path from "path";
import { exec } from "child_process";
import * as cheerio from "cheerio";
import Listing from "../model/listing.model";
import Agent from "../model/agent.model";
import "dotenv/config";

const API_KEY = process.env.API_KEY_SCRAP_BEE;
const BASE_URL = "https://app.scrapingbee.com/api/v1/";

// export const scrapWithScrapingBee = async (pageUrl: string): Promise<string | null> => {
//     try {
//         const config = {
//             method: "get" as const,
//             url: BASE_URL,
//             params: {
//                 url: pageUrl,
//                 api_key: API_KEY,
//                 render_js: true,
//                 wait: 8000,
//                 stealth_proxy: true,
//                 window_width: 1920,
//                 window_height: 1080,
//                 wait_for: "networkidle",
//             },
//             headers: {
//                 Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
//             },
//             timeout: 90000,
//         };

//         const response = await axios.request(config);
//         const html = response.data;

//         if (!html || typeof html !== "string") return null;

//         fs.writeFileSync("scrapingbee_result.html", html, "utf-8");
//         console.log("💾 Saved ScrapingBee HTML result");

//         return path.resolve("scrapingbee_result.html");
//     } catch (error: any) {
//         console.error("💥 ScrapingBee error:", error.message);
//         return null;
//     }
// };

export const scrapWithScrapingBee = async (pageUrl: string): Promise<string | null> => {
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const config = {
                method: "get" as const,
                url: BASE_URL,
                params: {
                    url: pageUrl,
                    api_key: API_KEY,
                    render_js: true,
                    wait: 8000,
                    stealth_proxy: true,
                    window_width: 1920,
                    window_height: 1080,
                    wait_for: "networkidle",
                },
                headers: {
                    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                },
                timeout: 90000,
            };

            const response = await axios.request(config);
            const html = response.data;

            if (!html || typeof html !== "string") throw new Error("Invalid HTML response");

            fs.writeFileSync("scrapingbee_result.html", html, "utf-8");
            console.log("💾 Saved ScrapingBee HTML result (attempt", attempt, ")");

            return path.resolve("scrapingbee_result.html");
        } catch (error: any) {
            console.error(`💥 ScrapingBee error (attempt ${attempt}/${MAX_RETRIES}):`, error.message);

            if (attempt === MAX_RETRIES) {
                console.error("❌ All retry attempts failed");
                return null;
            }

            // Optional: add a short delay before retry
            await new Promise((res) => setTimeout(res, 2000));
        }
    }

    return null;
};


const saveScrapedData = async (scrapedData: any) => {
    try {
        let agentDoc = null;
        const agentInfo = scrapedData.agents?.[0];

        console.log("🤵 Agent info:", agentInfo);

        if (agentInfo) {
            agentDoc = await Agent.findOne(
                { phoneNumber: agentInfo?.phone }
            );
            if (agentDoc) {
                agentDoc.fullName = agentInfo.name || agentDoc.fullName;
                agentDoc.brokerage = agentInfo.brokerage || agentDoc.brokerage;
                agentDoc.image = agentInfo.image || agentDoc.image;
                await agentDoc.save();
            } else {
                agentDoc = new Agent({
                    fullName: agentInfo?.name,
                    phoneNumber: agentInfo?.phone,
                    brokerage: agentInfo?.brokerage,
                    image: agentInfo?.image,
                });
                await agentDoc.save();
                console.log("✅ New Agent created:", agentDoc._id);
            }
        }


        const listingDoc = new Listing({
            title: scrapedData.title,
            price: scrapedData.price,
            address: scrapedData.address,
            beds: scrapedData.beds,
            baths: scrapedData.baths,
            floor: scrapedData.floor,
            description: scrapedData.description,
            homeHighlights: scrapedData.homeHighlights,
            features: scrapedData.features,
            communityDescription: scrapedData.communityDescription,
            officeDetails: scrapedData.officeDetails,
            images: scrapedData.images,
            agentId: agentDoc ? agentDoc._id : undefined,
        });

        await listingDoc.save();
        console.log("✅ Listing saved with Agent:", listingDoc._id);
        return listingDoc;
    } catch (err) {
        console.error("💥 Error saving scraped data:", err);
    }
};

export const loadLocalHtmlWithPuppeteer = async (localFilePath: string) => {
    let browser: any;
    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',

            headless: true
        });
        const page = await browser.newPage();

        console.log("🌐 Injecting local HTML content...");

        const html = fs.readFileSync(localFilePath, "utf-8");

        await page.setContent(html, { waitUntil: "domcontentloaded" });

        await autoScroll(page);

        const outputFile = "scrolled_local_result.html";

        if (fs.existsSync(outputFile)) {
            console.log("🗑️ Removed previous saved HTML");
            fs.unlinkSync(outputFile);
        }

        const finalHtml = await page.content();
        fs.writeFileSync(outputFile, finalHtml, "utf-8");
        console.log("💾 Saved new scrolled local HTML result:", outputFile);

        // const absolutePath = path.resolve(outputFile);
        // const fileUrl = `file://${absolutePath}`;

        // if (process.platform === "win32") {
        //     exec(`start ${fileUrl}`);
        // } else if (process.platform === "darwin") {
        //     exec(`open ${fileUrl}`);
        // } else {
        //     exec(`xdg-open ${fileUrl}`);
        // }

        const galleryImages = await scrapeGalleryImages(page);

        const scrapedData = await scrapePropertyData(outputFile);

        scrapedData.images = galleryImages;

        // console.log(scrapedData);
        // const txtFile = "scraped_data.txt";
        // fs.writeFileSync(txtFile, JSON.stringify(scrapedData, null, 2), "utf-8");
        try {
            await saveScrapedData(scrapedData);
        } catch (error) {
            console.error("💥 Error saving scraped data to DB:", error);
        }

        fs.unlinkSync(localFilePath);

    } catch (err: any) {
        console.error("💥 Puppeteer failed:", err.message);
    } finally {
        if (browser) await browser.close();
    }
};

export const scrapePropertyData = async (htmlFilePath: string) => {
    const html = fs.readFileSync(htmlFilePath, "utf-8");
    const $ = cheerio.load(html);

    const result: any = {};

    // 🏠 Title
    result.title = $(".fw_900.textStyle_subHeader").first().text().trim();

    // 💲 Price
    result.price = $("[data-testid='on-market-price-details']").first().text().trim();

    // 📍 Address
    result.address = $("[data-testid='home-details-summary-city-state']").text().trim();

    // 🛏️ Beds
    result.beds = {
        value: $("[data-testid='bed'] div.mx_xxs").text().trim(),
        image: $("[data-testid='bed'] img").attr("src"),
    };

    // 🛁 Baths
    result.baths = {
        value: $("[data-testid='bath'] div.mx_xxs").text().trim(),
        image: $("[data-testid='bath'] img").attr("src"),
    };

    // 📐 Floor
    result.floor = {
        value: $("[data-testid='floor'] div.mx_xxs").text().trim(),
        image: $("[data-testid='floor'] img").attr("src"),
    };

    // 📝 Description
    result.description = $("[data-testid='home-description-text-description-text']").text().trim();

    // ✨ Home Highlights
    result.homeHighlights = [];
    $("[data-testid='home-highlights-container'] .cell").each((_, el) => {
        const key = $(el).find(".d_block").first().text().trim();
        const value = $(el).find(".fw_bold").first().text().trim();
        const image = $(el).find("img").attr("src");

        if (key && value) {
            result.homeHighlights.push({ key, value, image });
        }
    });

    // 🏗️ Features
    result.features = [];
    $("[data-testid='features-container'] table").each((_, table) => {
        const section = $(table).find("thead h3 div").text().trim();
        const icon = $(table).find("thead img").attr("src");

        const items: any[] = [];
        $(table).find("tbody tr").each((_, row) => {
            const label = $(row).find("[data-testid='structured-amenities-table-subcategory']").text().trim();
            const values = $(row)
                .find("span, a")
                .map((_, el2) => $(el2).text().trim())
                .get()
                .filter((v) => v.length > 0);

            if (label || values.length > 0) {
                items.push({ label, values });
            }
        });

        if (section && items.length > 0) {
            result.features.push({ section, icon, items });
        }
    });

    // 🌍 Community description
    result.communityDescription = $("[data-testid='community-description-text-description-text']").text().trim();

    // 🏢 Office details
    result.officeDetails = {};
    const officeContainer = $("[data-testid='office-hours-container']");
    if (officeContainer.length > 0) {
        result.officeDetails.title = officeContainer.find("h3").text().trim();
        result.officeDetails.address = officeContainer
            .find(".cell div")
            .map((_, el) => $(el).text().trim())
            .get()
            .filter((v) => v.length > 0);
    }

    // 👨‍💼 Agents (both structures supported)
    result.agents = [];

    // Case 1: agent-contact
    $("[data-testid='agent-contact']").each((_, el) => {
        const name = $(el).find("span[title]").first().attr("title") || "";
        const phone = $(el).find("ul li").last().text().trim() || "";

        if (name || phone) {
            result.agents.push({ name, phone });
        }
    });

    // Case 2: provider-info
    $("[data-testid='provider-info']").each((_, el) => {
        const name = $(el).find("[data-testid='no-form-agent-name']").text().trim();
        const brokerage = $(el).find("[data-testid='broker-name']").text().trim();
        const phone = $(el).find("[data-testid='agent-phone']").text().replace("Agent Phone:", "").trim();
        const image = $(el).find("img").attr("src");

        if (name || brokerage || phone) {
            result.agents.push({ name, brokerage, phone, image });
        }
    });



    return result;
};

async function autoScroll(page: any) {
    await page.evaluate(async () => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 200;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    setTimeout(resolve, 1000);
                }
            }, 200);
        });
    });
}

export const scrapeGalleryImages = async (page: any): Promise<string[]> => {
    const images: Set<string> = new Set();
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
        const heroSelector = '[data-testid="hdp-hero-foreground"]';

        const heroExists = await page.$(heroSelector);

        if (heroExists) {
            await page.click(heroSelector);
            console.log("🖱️ Clicked on hero foreground");
            await delay(3000); // Give more time for modal to load
        }

        // 2. Close popup if exists
        const closeBtn = await page.$('[data-testid="close-button"]');
        if (closeBtn) {
            await closeBtn.click();
            console.log("❌ Closed popup");
            await delay(2000);
        }

        // 3. Try multiple gallery selectors with fallbacks
        const gallerySelector = '[data-testid="grid-gallery"]';
        const possibleScrollSelectors = [
            'div.h_100% .ov-y_auto.pos_relative',
            '.ov-y_auto',
            '.pos_relative',
            '[data-testid="grid-gallery"]',
            '.gallery-container',
            '.modal-body',
            '.scroll-container'
        ];

        let scrollableElement = null;
        let workingSelector = null;

        // Try to find a scrollable container
        for (const selector of possibleScrollSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 3000 });
                scrollableElement = await page.$(selector);
                if (scrollableElement) {
                    workingSelector = selector;
                    console.log(`✅ Found scrollable element with selector: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`⚠️ Selector not found: ${selector}`);
                continue;
            }
        }

        // If we found a scrollable element, scroll it
        if (scrollableElement && workingSelector) {
            await page.evaluate(async (scrollSelector) => {
                const el = document.querySelector(scrollSelector);
                if (!el) return;

                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 300;
                    let scrollAttempts = 0;
                    const maxAttempts = 20; // Prevent infinite scrolling

                    const timer = setInterval(() => {
                        const previousScrollTop = el.scrollTop;
                        el.scrollBy(0, distance);
                        totalHeight += distance;
                        scrollAttempts++;

                        // Check if we've reached the bottom or max attempts
                        if (
                            el.scrollHeight - el.scrollTop <= el.clientHeight + 50 ||
                            el.scrollTop === previousScrollTop ||
                            scrollAttempts >= maxAttempts
                        ) {
                            clearInterval(timer);
                            setTimeout(resolve, 1000);
                        }
                    }, 200);
                });
            }, workingSelector);

            console.log("📜 Scrolled gallery container");
        } else {
            // Fallback: scroll the entire page
            console.log("⚠️ No scrollable container found, scrolling entire page");
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 300;
                    let scrollAttempts = 0;
                    const maxAttempts = 10;

                    const timer = setInterval(() => {
                        const previousScrollTop = window.pageYOffset;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        scrollAttempts++;

                        if (
                            totalHeight >= document.body.scrollHeight ||
                            window.pageYOffset === previousScrollTop ||
                            scrollAttempts >= maxAttempts
                        ) {
                            clearInterval(timer);
                            setTimeout(resolve, 1000);
                        }
                    }, 200);
                });
            });
        }

        await delay(3000);

        const imageSelectors = [
            '[data-testid="grid-gallery"] img',
            '.gallery img',
            '.image-gallery img',
            '.photo-gallery img',
            'img[src*="photo"]',
            'img[src*="image"]',
            'img'
        ];

        for (const selector of imageSelectors) {
            try {
                // Extract image src attributes
                const newImages = await page.$$eval(selector, (imgs) =>
                    imgs.map((img) => (img as HTMLImageElement).src).filter(src => src && src.length > 0)
                );
                newImages.forEach((url) => images.add(url));

                // Extract srcset attributes
                const srcSetImages = await page.$$eval(selector, (imgs) =>
                    imgs
                        .map((img) => (img as HTMLImageElement).srcset || "")
                        .flatMap((set) =>
                            set
                                .split(",")
                                .map((part) => part.trim().split(" ")[0])
                                .filter((u) => u.length > 0)
                        )
                );
                srcSetImages.forEach((url) => images.add(url));

                if (newImages.length > 0) {
                    console.log(`✅ Found ${newImages.length} images with selector: ${selector}`);
                }
            } catch (e) {
                console.log(`⚠️ Failed to extract images with selector: ${selector}`);
            }
        }

        try {
            const sourceImages = await page.$$eval("source", (sources) =>
                sources
                    .map((s) => (s as HTMLSourceElement).srcset || "")
                    .flatMap((set) =>
                        set
                            .split(",")
                            .map((part) => part.trim().split(" ")[0])
                            .filter((u) => u.length > 0)
                    )
            );
            sourceImages.forEach((url: any) => images.add(url));
        } catch (e) {
            console.log("⚠️ No source tags found");
        }

        console.log(`📸 Extracted ${images.size} unique gallery images`);



        const validImages = Array.from(images).filter(url => {
            try {
                new URL(url);
                return url.includes('http') && !url.includes('data:') && url.includes('pictures');
            } catch {
                return false;
            }
        });

        return validImages;

    } catch (err: any) {
        console.log(err);
        try {
            const fallbackImages = await page.$$eval('img', (imgs) =>
                imgs.map((img) => (img as HTMLImageElement).src).filter(src => src && src.includes('http'))
            );
            console.log(`🔄 Fallback: Found ${fallbackImages.length} images`);
            return fallbackImages;
        } catch (fallbackErr) {
            console.log("💥 Fallback image extraction also failed");
            return [];
        }
    }
};
