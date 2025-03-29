import {Communicator} from './bot/communicator';

import {getDefaultApiToken} from "./bot/env";
import {ReactMessage} from "./bot/react/core/message/message";
import axios from "axios";
import {Counter} from "./bot/react/examples/Counter";
import {assignReviewers} from "./reviewers";
import {MRNotFound} from "./bot/Components/Errors";

export const mineTelegramAcc = '415887410';

const communicator = Communicator.getDefault();

const pullUpdates = async () => {
    const result = await communicator.pullUpdates()
    result.forEach((message) =>{
        if (message.type === 'message' && message.body) {
            assignReviewers(message.body)
            // todo: remove
            return
        }
    })
    // console.log(`bots result after ${duration} second(s) of communicator.pullUpdates`, result)
    setTimeout(() => {
        pullUpdates()
    }, 1000)
}

const start = async() =>{
    // TODO: if telegram bot
    await axios.get(`https://api.telegram.org/bot${getDefaultApiToken()}/deleteWebhook`);

    await pullUpdates();

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
