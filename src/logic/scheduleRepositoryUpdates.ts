import {isWorkingDay} from "@/logic/isWorkingDay";

const isWithinWorkingHours = (date: Date): boolean => {
    const hours = date.getHours();
    return hours >= 10 && hours < 18;
};

export const scheduleRepositoryUpdates = async (updatingInfo: VoidFunction) => {
    const now = new Date();
    const moscowTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Moscow"}));

    if (await isWorkingDay(moscowTime) && isWithinWorkingHours(moscowTime)) {
        updatingInfo()
    }

    // Schedule next check in 5 minutes
    setTimeout(() => scheduleRepositoryUpdates(updatingInfo), 5 * 60 * 1000);
};