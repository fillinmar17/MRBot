import {MongoDbService} from "@/database/MongoDbService";
import {checkUnreviewedPRs} from "@/reviewers/reminders";
import {isWorkingDay} from "@/logic/isWorkingDay";

export const scheduleReminders = async (mongoService: MongoDbService) => {
    const now = new Date();
    const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));
    const hours = moscowTime.getHours();
    const minutes = moscowTime.getMinutes();

    // Check if it's time for reminders (10:15 or 16:00 Moscow time)
    if ((hours === 10 && minutes === 15) || (hours === 16 && minutes === 0)) {
        if (await isWorkingDay(moscowTime)) {
            await checkUnreviewedPRs(mongoService);
        }
    }
    await checkUnreviewedPRs(mongoService);
    setTimeout(() => scheduleReminders(mongoService), 60 * 1000);
};