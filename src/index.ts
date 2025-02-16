import {scheduleJob} from "node-schedule";
import {Config} from "./config/Config";
import {Communicator} from './bot/communicator';

import {getDefaultApiToken} from "./bot/env";
import {assignReviewers, MR_URL} from "./reviewers";
import {ReactMessage} from "./bot/react/core/message/message";
import {TextMessage} from "./bot/react/core/message/error";
import {Text} from "./bot/react/ui/Text";
import {Form, FormDataType, formItemElement, FormItemEx} from "./bot/react/ui/Form";

import axios from "axios";

import express from "express";
import {ClickedKeyboardButton, MessageKeyboardContext, MessageKeyboardLayout} from "@/bot/keyboard";
import {Counter} from "./Counter";

const app = express();
app.use(express.json());

const mineAcc = '415887410';

const config = new Config();


config.parameters.settings.users.map(async user => {
    const communicator = Communicator.getDefault();

    await axios.get(`https://api.telegram.org/bot${getDefaultApiToken()}/deleteWebhook`);


    // send message button with
    // const inlineKeyboard = {
    //     inline_keyboard: [
    //         [
    //             { text: 'Increment me 3', callback_data: 'increment'}
    //         ]
    //     ]
    // };
    // try {
    //     const response = await axios.post(`https://api.telegram.org/bot${getDefaultApiToken()}/sendMessage`, {
    //         chat_id: mineAcc,
    //         text: 'messageText',
    //         reply_markup: JSON.stringify(inlineKeyboard), // convert to JSON string
    //         parse_mode: 'HTML' // optional: use HTML formatting
    //     });
    //
    //     console.log('Message sent successfully:', response.data);
    // } catch (error) {
    //     console.error('Error sending message:', error);
    // }

    // await ReactMessage.describe('urlKeyboard', Keyboard).send(mineAcc,{children: urlButton }, undefined)
    // await ReactMessage.describe('counterButton', Keyboard).send(mineAcc,{children: counterButton }, undefined, '179')

    // const keyboardLayout: MessageKeyboardLayout = {
    //     main: () => [
    //         [
    //             { name: 'Option1', text: 'Select Option 1', data: { key: 'value1' } },
    //             { name: 'Option2', text: 'Select Option 2', data: { key: 'value2' } }
    //         ],
    //     ],
    // };
    // const handleButtonClick = (ctx: MessageKeyboardContext<ClickedKeyboardButton>, button: ClickedKeyboardButton) => {
    //     ctx.reply(`You selected ${button.name}`);
    // };

    // const keyboard = Communicator.createKeyboard({
    //     id: 'counterButton',
    //     layout: keyboardLayout,
    //     handle: handleButtonClick,
    // });

    // await ReactMessage.describe('counterButton', Keyboard).send(mineAcc,{children: counterButton }, undefined)

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
