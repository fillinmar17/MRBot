import {EmbedBuilder, RGBTuple} from "discord.js";
import {PullRequest} from "../repository/Github";
import dayjs from "dayjs";
import {Config} from "../config/Config";
import i18next from "i18next";

const config = new Config();

const delaysColors: { [key: string]: RGBTuple } = {
    GREEN: [64, 194, 77],
    YELLOW: [224, 215, 40],
    ORANGE: [215, 113, 22],
    RED: [215, 113, 113],
}

const ReminderColor = (delaysInDays: number): RGBTuple => {
    const delayColorAfterDays = config.parameters.settings.delay_color_after_days;

    if (delaysInDays <= delayColorAfterDays.yellow) {
        return delaysColors.GREEN;
    }
    if (delaysInDays > delayColorAfterDays.yellow && delaysInDays <= delayColorAfterDays.orange) {
        return delaysColors.YELLOW;
    }

    if (delaysInDays > delayColorAfterDays.orange && delaysInDays <= delayColorAfterDays.red) {
        return delaysColors.ORANGE;
    }

    return delaysColors.RED;
}

export const ReminderMessage = (pullrequest: PullRequest): EmbedBuilder => {
    const createdAtFormatted = dayjs(pullrequest.createdAt).format(config.parameters.settings.date_format)
    const delaysInDays = dayjs(new Date()).diff(pullrequest.createdAt, 'days')
    const builder = new EmbedBuilder();
    const delaySentence = i18next.t('reminder.footer.base', {
        createdAtFormatted,
        delay: i18next.t('reminder.footer.delay', {count: delaysInDays})
    })

    return builder
        .setColor(ReminderColor(delaysInDays))
        .setTitle(pullrequest.title)
        .setURL(pullrequest.url)
        .setAuthor({
            name: pullrequest.author.username,
            iconURL: pullrequest.author.avatar
        })
        .setDescription(i18next.t('reminder.description', {username: pullrequest.author.username}))
        .setTimestamp()
        .setFooter({
            text: delaySentence
        });
}
