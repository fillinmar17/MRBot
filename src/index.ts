import {getBotType, getDefaultApiToken, getMongoDBUrl} from "./bot/env";
import axios from "axios";
import 'dotenv/config'
import {MongoDbService} from "@/database/MongoDbService";
import {updatingInfo} from "@/logic/updatingInfo";
import {scheduleRepositoryUpdates} from "@/logic/scheduleRepositoryUpdates";
import {pullUpdates} from "@/logic/pullUpdates";
import {scheduleReminders} from "@/logic/scheduleReminders";


const start = async () => {
    if (getBotType() === "telegram") {
        await axios.get(`https://api.telegram.org/bot${getDefaultApiToken()}/deleteWebhook`);
    }
    const mongoService = new MongoDbService(getMongoDBUrl(), 'myProject');
    await mongoService.connect();

    await scheduleRepositoryUpdates(() => updatingInfo(mongoService));
    await scheduleReminders(mongoService);
    await pullUpdates(mongoService);
}

start()
