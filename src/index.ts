import {scheduleJob} from "node-schedule";
import {Config} from "./config/Config";
import {Communicator} from './bot/communicator';

import {getDefaultApiToken} from "./bot/env";
import {assignReviewers, MR_URL} from "./reviewers";
import {ReactMessage} from "./bot/react/core/message/message";
import {TextMessage} from "./bot/react/core/message/error";
import {Text} from "./bot/react/ui/Text";
import {Form, FormDataType, formItemElement, FormItemEx} from "./bot/react/ui/Form";
import {
    counterButton,
    fu,
    Keyboard,
    KeyboardButtonElement,
    KeyboardRowElement,
    urlButton
} from "./bot/react/ui/Keyboard";
import axios from "axios";

import express from "express";
const PORT = 3000;

const app = express();
app.use(express.json());

const mineAcc = '415887410';

const config = new Config();

const subscribers: Set<number> = new Set();

const sendMessage = async (chatId: number, text: string) => {
    const url = `https://api.telegram.org/bot${getDefaultApiToken()}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(text)}`;
    await fetch(url);
};

const handleUpdate = (update: any) => {
    console.log('logs update', JSON.stringify(update));
    const chatId = update.message.chat.id;
    const text = update.message.text;

    if (text === '/subscribe') {
        subscribers.add(chatId);
        sendMessage(chatId, 'You have subscribed!');
    } else if (text === '/unsubscribe') {
        subscribers.delete(chatId);
        sendMessage(chatId, 'You have unsubscribed!');
    } else {
        sendMessage(chatId, 'Unknown command. Use /subscribe to subscribe and /unsubscribe to unsubscribe.');
    }
};

const processUpdates = (updates: any) => {
    for (const update of updates) {
        if (update.message) {
            handleUpdate(update);
        }
    }
};

const getUpdates = async (offset: number) => {
    const url = `https://api.telegram.org/bot${getDefaultApiToken()}/getUpdates?offset=${offset}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.result;
};

const startPolling = async () => {
    console.log('logs Starting Polling...');
    let offset = 0;

    while (true) {
        const updates = await getUpdates(offset);
        if (updates && updates.length > 0) {
            processUpdates(updates);
            offset = updates[updates.length - 1].update_id + 1; // Move the offset forward
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep to avoid hitting rate limits
    }
};

// startPolling()

config.parameters.settings.users.map(async user => {
    const communicator = Communicator.getDefault();
    console.log('logs user', user)

    const messageText = "Click the button below to Increment";
    //
    const resdeleteWebhook = await axios.get(`https://api.telegram.org/bot${getDefaultApiToken()}/deleteWebhook`);
    // console.log('logs res deleteWebhook', resdeleteWebhook)

    // Create the inline keyboard structure
    const inlineKeyboard = {
        inline_keyboard: [
            [
                { text: 'Increment me 3', callback_data: ['click'] }
            ]
        ]
    };

    // send message button with
    // try {
    //     const response = await axios.post(`https://api.telegram.org/bot${getDefaultApiToken()}/sendMessage`, {
    //         chat_id: mineAcc,
    //         text: messageText,
    //         reply_markup: JSON.stringify(inlineKeyboard), // convert to JSON string
    //         parse_mode: 'HTML' // optional: use HTML formatting
    //     });
    //
    //     console.log('Message sent successfully:', response.data);
    // } catch (error) {
    //     console.error('Error sending message:', error);
    // }



    // send message button with react part
    // await ReactMessage.describe('urlKeyboard', Keyboard).send(mineAcc,{children: urlButton }, undefined)
    await ReactMessage.describe('counterButton', Keyboard).send(mineAcc,{children: counterButton }, undefined)

    setTimeout(async ()=> {
        const result = await communicator.pullUpdates()
        console.log('bots result after 3 minit of communicator.pullUpdates', result)
    }, 3000)

    // const reactik = new ReactMessage({
    //     ns: 'what is it',
    //     to: mineAcc,
    //     initialProps: undefined,
    //     hooksState: [],
    //     minApplyDelay: 1100,
    //     // ...init,
    //     bot: Communicator.getDefault().getProvider('telegram')!,
    // })

    // await ReactMessage.describe('text', Text).send(mineAcc,{children: 'mineAcc', underline: true}, undefined)

    // const initialData: FormDataType = {
    //     name: '',
    //     email: '',
    // };
    // await ReactMessage.describe('form', Form).send(mineAcc,{initialData:initialData, children: formItemElement}, undefined)

    // its a way to send messages
    // await communicator.sendMessage([`telegram:${mineAcc}`],
    //     `Hi, *%username%*!
    //      Message sent via \`Communicator\`
    // `);

    // assignReviewers(MR_URL).catch(console.error);

  // todo: reminders
  user.scheduled_notifications.map(async scheduled_notification => {
    // Instantiate schedules
    scheduleJob(scheduled_notification, async function () {
      let pullRequests = [];
      for (let i = 0; i < user.repositories.length; i++) {
        // const repository = user.repositories[i];
        // const pullRequestsWaitingForReview = await github.getPullRequestsWaitingForReview(repository, githubUsername, user.github_token);
        // if(pullRequestsWaitingForReview.length > 0){
        //   pullRequests = pullRequests.concat(pullRequestsWaitingForReview);
        // }
      }
      if (pullRequests.length > 0) {
        // logger.info(`Sending reminder to ${userDescription(user.discord_id, githubUsername)}`)
        //
        // pullRequests.map(pullRequest => discordClient.sendMessage(user.discord_id, githubUsername, pullRequest))
      }
    });
  });
});
