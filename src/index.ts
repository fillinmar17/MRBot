import {scheduleJob} from "node-schedule";
import {Communicator} from './bot/communicator';

import {getDefaultApiToken} from "./bot/env";
import {ReactMessage} from "./bot/react/core/message/message";
import axios from "axios";

import express from "express";
import {Counter} from "./bot/react/examples/Counter";

const app = express();
app.use(express.json());

const mineAcc = '415887410';

const communicator = Communicator.getDefault();

const start = async() =>{
    await axios.get(`https://api.telegram.org/bot${getDefaultApiToken()}/deleteWebhook`);

    const sendCounterMessage = async (chatId: string) => {
        await ReactMessage.describe('counter', Counter).send(
            chatId,
            {},
            {
                minApplyDelay: 1100,
            }
        );
    };

    await sendCounterMessage(mineAcc);

    setTimeout(async () => {
        const result = await communicator.pullUpdates()
        console.log('bots result after 3 minit of communicator.pullUpdates', result)
    }, 3000)


// todo: reminders
// user.scheduled_notifications.map(async scheduled_notification => {
//     // Instantiate schedules
//     scheduleJob(scheduled_notification, async function () {
//         let pullRequests = [];
//         for (let i = 0; i < user.repositories.length; i++) {
//             // const repository = user.repositories[i];
//             // const pullRequestsWaitingForReview = await github.getPullRequestsWaitingForReview(repository, githubUsername, user.github_token);
//             // if(pullRequestsWaitingForReview.length > 0){
//             //   pullRequests = pullRequests.concat(pullRequestsWaitingForReview);
//             // }
//         }
//         if (pullRequests.length > 0) {
//             // logger.info(`Sending reminder to ${userDescription(user.discord_id, githubUsername)}`)
//             //
//             // pullRequests.map(pullRequest => discordClient.sendMessage(user.discord_id, githubUsername, pullRequest))
//         }
//     });
// });
}
start()
