import cron from "node-cron";
import moment from "moment-timezone";
import dotenv from "dotenv";
import path from "path";
import { ScheduleSms } from "../model/scheduleSms.model";
import Agent from "../model/agent.model";
import twilio from "twilio";
dotenv.config();

console.log("check")
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);



// Helper: sleep
const delay = (seconds: number) =>
    new Promise((res) => setTimeout(res, seconds * 1000));

/**
 * CRON JOB - Runs every minute
 * Checks for pending SMS schedules and processes them
 */
cron.schedule("* * * * *", async () => {
    // console.log("🕐 [Cron] Checking for scheduled SMS tasks...");

    try {
        // Fetch pending tasks where whenToSend <= current UTC time
        const nowUTC = new Date();
        const pendingSchedules = await ScheduleSms.find({
            whenToSend: { $lte: nowUTC },
            status: "pending",
        });

        if (pendingSchedules.length === 0) {
            // console.log("[Cron] No pending SMS tasks found.");
            return;
        }

        console.log(`🚀 [Cron] Found ${pendingSchedules.length} pending SMS job(s).`);

        for (const job of pendingSchedules) {
            console.log(`📦 Processing job: ${job._id} for agent: ${job.agentId}`);

            // Mark as in-progress
            job.status = "in-progress";
            await job.save();

            try {
                // Fetch agent info
                const agent = await Agent.findById(job.agentId);
                if (!agent) {
                    console.error(`❌ Agent not found for job ${job._id}`);
                    job.status = "failed";
                    await job.save();
                    continue;
                }

                const { countryCode = "+1", phoneNumber } = agent;
                const fullNumber = `${countryCode}${phoneNumber?.replace(/\D/g, "")}`;

                console.log(
                    `📨 Sending ${job.totalCount} SMS to ${fullNumber} (Agent: ${agent.fullName})`
                );

                let mediaUrl: string[] | undefined;
                if (agent.discountCardJpeg) {
                    let cleanPath = agent.discountCardJpeg.replace(/^src[\\/]/, "").replace(/\\/g, "/");
                    
                    if (!cleanPath.startsWith("/uploads/")) {
                        if (cleanPath.startsWith("uploads/")) {
                            cleanPath = `/${cleanPath}`;
                        } else {
                            cleanPath = `/uploads/${cleanPath}`;
                        }
                    }
                    
                    const baseUrl = process.env.BASE_URL || process.env.BACKEND_URL || "http://18.223.150.51:8000";
                    
                    let fullBaseUrl = baseUrl;
                    if (!fullBaseUrl.startsWith("http://") && !fullBaseUrl.startsWith("https://")) {
                        fullBaseUrl = `http://${fullBaseUrl}`;
                    }
                    
                    const fullUrl = `${fullBaseUrl.replace(/\/+$/, "")}${cleanPath}`;
                    
                    if (!fullUrl.includes("localhost") && !fullUrl.includes("127.0.0.1")) {
                        try {
                            new URL(fullUrl); // Validate URL format
                            mediaUrl = [fullUrl];
                            console.log(`Including discount card image: ${fullUrl}`);
                        } catch (error) {
                            console.warn(`Invalid media URL, sending text-only SMS: ${fullUrl}`);
                        }
                    } else {
                        console.warn(`Media URL is localhost, sending text-only SMS`);
                    }
                }

                for (let i = 0; i < job.totalCount; i++) {
                    // Build message options
                    const messageOptions: any = {
                        body: job.message,
                        from: process.env.TWILIO_FROM,
                        to: fullNumber,
                    };

                    // Add media URL if available
                    if (mediaUrl && mediaUrl.length) {
                        messageOptions.mediaUrl = mediaUrl;
                    }

                    // Send SMS/MMS via Twilio
                    await client.messages.create(messageOptions);

                    console.log(`SMS ${i + 1}/${job.totalCount} sent successfully.`);

                    // Delay if not last message
                    if (i !== job.totalCount - 1) {
                        const delaySec = job.randomDelay
                            ? Math.floor(
                                Math.random() * (job.maxDelay - job.minDelay + 1)
                            ) + job.minDelay
                            : job.minDelay;

                        console.log(`⏳ Waiting ${delaySec}s before next SMS...`);
                        await delay(delaySec);
                    }
                }

                // Mark job completed
                job.status = "completed";
                await job.save();
                console.log(`🎉 Job ${job._id} completed successfully.`);
            } catch (innerErr: any) {
                console.error(`💥 Error processing job ${job._id}:`, innerErr.message);
                job.status = "failed";
                await job.save();
            }
        }
    } catch (err: any) {
        console.error("💥 [Cron] Fatal error in scheduler:", err.message);
    }
});
