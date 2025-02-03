import axios from "axios";
import {ReactMessage} from "../bot/react/core/message/message";
import {MRNotFound, SomethingWentWrong} from "../bot/Components/Errors";
import {SuccessAssignReviewers, SuccessAssignReviewersType} from "@/bot/Components/SuccessAssignReviewers";
import {getChangedFiles} from "@/reviewers/getChangedFiles";
import {SuggestReviewers, SuggestReviewersType} from "@/bot/Components/SuggestReviewers";
import {getCollaborators} from "@/reviewers/getCollaborators";
import {filterAvailableUsers} from "@/reviewers/filterAvailableUsers";
import {selectScoredReviewers} from "@/reviewers/calculateReviewScore";
import {getPotentialReviewers} from "@/reviewers/getPotentialReviewers";

export const GITHUB_TOKEN = process.env['GITHUB_TOKEN'] || '';

export type MRInfoType = {
    REPO_OWNER: string,
    REPO_NAME: string,
    PR_NUMBER: string,
    REPO_LINK?: string,
}

const getMRInfoFromUrl = (mr: string): MRInfoType | undefined => {
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const matches = mr.match(regex);
    if (matches && matches.length >= 4) {
        const parts = mr.split('/');
        const REPO_OWNER = matches[1];
        const REPO_NAME = matches[2];
        const PR_NUMBER = matches[3];
        let REPO_LINK
        if (parts.length >= 5) {
            const domain = `${parts[0]}//${parts[2]}`;
            const repositoryPath = `${parts[3]}/${parts[4]}`;
            REPO_LINK = `${domain}/${repositoryPath}`
        }
        return {REPO_OWNER, REPO_NAME, PR_NUMBER, REPO_LINK}
    }
    return
}

export type MRFilesTypes = {
    filename: string,
    status: string,
    additions: number,
    deletions: number,
}

export const API_GITHUB_URL = 'https://api.github.com/'

export const addReviewersToPR = async (mrInfo: MRInfoType, mrLink: string, selectedReviewers: string[], chatId: string): Promise<string[] | undefined> => {
    const {REPO_OWNER, REPO_NAME, PR_NUMBER} = mrInfo;
    try {
        const response = await axios.post(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/requested_reviewers`, {
            reviewers: selectedReviewers
        }, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        const futureReviewers = response.data.requested_reviewers.map((reviewers) => reviewers.login) as string[]
        if (futureReviewers.length > 0) {
            await sendSuccessAssignReviewersMessage(chatId, {
                reviewers: futureReviewers,
                repoName: mrInfo.REPO_NAME,
                repoHref: mrInfo.REPO_LINK,
                mrNumber: parseInt(mrInfo.PR_NUMBER),
                mrUrl: mrLink,
            });
        }
        return futureReviewers
    } catch (error) {
        // todo: уведомить что что-то пошло не так
        console.error('[ERROR] addReviewersToPR', error);
        return undefined;
    }
}

export const sendMRNotFoundMessage = async (chatId: string, link: string) => {
    await ReactMessage.describe('mrnotfound', MRNotFound).send(
        chatId,
        {link: link},
        {
            minApplyDelay: 1000,
        }
    );
};

const sendSuccessAssignReviewersMessage = async (chatId: string, props: SuccessAssignReviewersType) => {
    await ReactMessage.describe('setReviewers', SuccessAssignReviewers).send(
        chatId,
        props,
    );
};

const sendSomethingWentWrongMessage = async (chatId: string) => {
    await ReactMessage.describe('somethingWentWrong', SomethingWentWrong).send(
        chatId,
        {},
    );
};

const sendSuggestReviewers = async (chatId: string, props: SuggestReviewersType) => {
    await ReactMessage.describe('suggestReviewers', SuggestReviewers).send(
        chatId,
        props,
    );
};

export const assignReviewers = async(mr: string, chatId: string)=> {
    try {
        const mrInfo = getMRInfoFromUrl(mr)

        if (!mrInfo) {
            await sendMRNotFoundMessage(chatId, mr);
            return;
        }

        const {files: changedFiles} = await getChangedFiles(mrInfo, mr, chatId);
        const collaborators = await getCollaborators(mrInfo);
        const potentialReviewers = await getPotentialReviewers(mrInfo, collaborators.map((collaborator) => collaborator.login));
        const availableUsers = await filterAvailableUsers(potentialReviewers)
        const scoredReviewers = await selectScoredReviewers(mrInfo.REPO_NAME, mrInfo.REPO_OWNER, availableUsers, changedFiles.map((files) => files.filename))

        await sendSuggestReviewers(chatId, {
            repoName: mrInfo.REPO_NAME,
            repoHref: mrInfo.REPO_LINK,
            mrNumber: parseInt(mrInfo.PR_NUMBER),
            mrUrl: mr,
            suggesters: scoredReviewers,
            setReviewers: async () => {
                await addReviewersToPR(mrInfo, mr, scoredReviewers, chatId)
            },
        })
    } catch (error) {
        console.log('[ERROR] trying assignReviewers', error)
        await sendSomethingWentWrongMessage(chatId)
    }
}

