import {MongoDbService} from "@/database/MongoDbService";
import {addUser} from "@/database/addUser/addUser";
import {assignReviewers} from "@/reviewers";
import {Communicator} from "@/bot/communicator";

const communicator = Communicator.getDefault();
export const pullUpdates = async (mongoService: MongoDbService) => {
    try {
        const result = await communicator.pullUpdates();
        for (const message of result) {
            if (!message.user?.id || message.type === 'callback') continue;
            const chatId = message.chat.id;
            const text = message.type === 'message' ? message.body || '' : '';
            const userId = message.user.id;
            const userInDB = await mongoService.findUser(userId);
            console.log('logs userInDB', userInDB, 'text: ', text, 'userId', userId)

            if (!userInDB) {
                await addUser(chatId, text, mongoService.addUser)
            } else if (message.type === 'message' && message.body) {
                assignReviewers(message.body, chatId);
            }
        }

        console.log('Result from communicator.pullUpdates:', result, new Date().toISOString());
    } catch (error) {
        console.error('[Error] in pullUpdates:', error);
    }

    setTimeout(() => pullUpdates(mongoService), 1000);
};