import cron from "node-cron";
import moment from "moment-timezone";
import dotenv from "dotenv";
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
    console.log("🕐 [Cron] Checking for scheduled SMS tasks...");

    try {
        // Fetch pending tasks where whenToSend <= current UTC time
        const nowUTC = new Date();
        const pendingSchedules = await ScheduleSms.find({
            whenToSend: { $lte: nowUTC },
            status: "pending",
        });

        if (pendingSchedules.length === 0) {
            console.log("✅ [Cron] No pending SMS tasks found.");
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

                for (let i = 0; i < job.totalCount; i++) {
                    // Send SMS via Twilio
                    await client.messages.create({
                        body: job.message,
                        from: process.env.TWILIO_FROM,
                        to: fullNumber,
                    });

                    console.log(`✅ SMS ${i + 1}/${job.totalCount} sent successfully.`);

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
