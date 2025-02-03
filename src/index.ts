import {scheduleJob} from "node-schedule";
import {Github} from "./repository/Github";
import {Config} from "./config/Config";
import {logger, userDescription} from "./logger/logger";
import {DiscordClient} from "./repository/Discord";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import en from "../translations/translations.en.json";
import fr from "../translations/translations.fr.json";
import es from "../translations/translations.es.json";
import {Communicator} from './bot/communicator';

import * as http from 'http';
import * as url from 'url';
import * as querystring from 'querystring';
import {getDefaultApiToken} from "@/bot/env";

const config = new Config();
const github = new Github();
const discordClient = new DiscordClient()
// Initialize translator
i18next
    .use(Backend)
    .init({
      lng: 'fr',
      fallbackLng: "en",
      debug: false,
      preload: ['en', 'fr', 'es'],
      ns: ['translations'],
      defaultNS: 'translations',
      backend: {
        loadPath: 'translations/{{ns}}.{{lng}}.json'
      },
      resources: {
        en: {
          translations: en
        },
        fr: {
          translations: fr
        },
        es: {
          translations: es
        }
      }
    });

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

        if (updates.length > 0) {
            processUpdates(updates);
            offset = updates[updates.length - 1].update_id + 1; // Move the offset forward
        }

        await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep to avoid hitting rate limits
    }
};

startPolling()

config.parameters.settings.users.map(async user => {
    console.log('logs user');
    const communicator = Communicator.getDefault();
    // Отправляем сообщение в VKTeams и Telegram
    // await communicator.sendMessage(['telegram:415887410'],
    //     `Hi, *%username%*!
    //      Message sent via \`Communicator\`
    // `);
    await communicator.sendMessage(['telegram:178714360'],
        `Hi, *%username%*!
         Message sent via \`Communicator\`
    `);
  const githubUsername = await github.getUsername(user.github_token);

  user.scheduled_notifications.map(async scheduled_notification => {
    // Instantiate schedules
    scheduleJob(scheduled_notification, async function () {
      logger.info(`Scheduled job triggered: ${scheduled_notification}`);
      let pullRequests = [];
      for (let i = 0; i < user.repositories.length; i++) {
        const repository = user.repositories[i];
        const pullRequestsWaitingForReview = await github.getPullRequestsWaitingForReview(repository, githubUsername, user.github_token);
        if(pullRequestsWaitingForReview.length > 0){
          pullRequests = pullRequests.concat(pullRequestsWaitingForReview);
        }
      }
      if (pullRequests.length > 0) {
        logger.info(`Sending reminder to ${userDescription(user.discord_id, githubUsername)}`)

        pullRequests.map(pullRequest => discordClient.sendMessage(user.discord_id, githubUsername, pullRequest))
      }
    });
  });
});
