import {Communicator} from './bot/communicator';

import {getDefaultApiToken, getMongoDBUrl} from "./bot/env";
import axios from "axios";
import {assignReviewers} from "./reviewers";
import {Collection, MongoClient} from 'mongodb';
import 'dotenv/config'
import {addUser} from "@/database/addUser/addUser";
import {getPullRequests} from "@/reviewers/getPullRequests";
import {ApprovingState, getMRApprovedStatus} from "@/reviewers/getMRApprovedStatus";
import {getCommitsFromMR} from "@/reviewers/getCommitsFromMR";
import {getCommentsFromMR} from "@/reviewers/getCommentsFromMR";
import {getNewComments} from "@/reviewers/checkMRStatusForReviewers";

const communicator = Communicator.getDefault();
const mineTelegramAcc = '415887410';

const pullUpdates = async () => {
    try {
        const result = await communicator.pullUpdates();
        for (const message of result) {
            if (!userCollection) {
                await initializeDB()
            }
            if (!message.user?.id) continue;
            const chatId = message.chat.id;
            const text = message.type === 'message' ? message.body || '' : '';
            const userId = message.user.id;
            const userInDB = await userCollection!.findOne({telegram: String(userId)});

            console.log('logs userInDB', userInDB, 'text', text,)

            if (!userInDB) {
                await addUser(chatId, text, userCollection!)
            } else if (message.type === 'message' && message.body) {
                // await collection!.deleteMany({ telegram: String(userId)})
                assignReviewers(message.body, chatId);
            }
        }

        console.log('Result from communicator.pullUpdates:', result);
    } catch (error) {
        console.error('Error in pullUpdates:', error);
    }

    // Рекурсивный вызов через 1 секунду
    setTimeout(pullUpdates, 1000);
};

const client = new MongoClient(getMongoDBUrl(), {monitorCommands: true})

let userCollection: Collection<Document> | undefined = undefined
let reposCollection: Collection<Document> | undefined = undefined
const dbName = 'myProject';
const initializeDB = async () => {
    // Use connect method to connect to the server
    await client.connect();
    console.log('Connected successfully to server');
    const db = client.db(dbName);
    userCollection = db.collection('users');
    reposCollection = db.collection('repos');
}

type reviewersWithStatus = {
    login: string
    approved: boolean
}

type UpdatedPullRequestsInfoType = {
    reviewers?: string[];
    approvers?: string[];
    lastCommitSha?: string;
    lastCommentId?: number;
}

type PullRequestsInfoType = {
    number: number;
    updated_at?: Date;
} & UpdatedPullRequestsInfoType

type RepoInDBType = {
    name: string,
    pullRequests: PullRequestsInfoType[]
}
const getRepoDetailsFromUrl = (url: string): { owner: string; name: string } | null => {
    const regex = /https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)/;
    const match = url.match(regex);

    if (match && match.length === 3) {
        const owner = match[1];
        const name = match[2];

        return {owner, name};
    }

    return null;
}

const start = async () => {
    // TODO: if telegram bot
    await axios.get(`https://api.telegram.org/bot${getDefaultApiToken()}/deleteWebhook`);

    await initializeDB();

    const findResult = await userCollection?.find({telegram: '415887410'}).toArray();
    const reposInfoFromDB = await reposCollection?.find({}).toArray() as RepoInDBType[];

    console.log('logs reposInfoFromDB: ', reposInfoFromDB)
    for (const repo of reposInfoFromDB) {
        let updatedRepo: UpdatedPullRequestsInfoType = {};
        console.log('logs repo.name: ', repo.name);
        const actualPullRequests = await getPullRequests(repo.name);
        if (!actualPullRequests || actualPullRequests.length === 0) {
            continue
        }
        const repoDetails = getRepoDetailsFromUrl(actualPullRequests[0].url)
        // console.log('logs actualPullRequests', actualPullRequests);
        if (!repoDetails) {
            continue
        }
        for (const actualPullRequest of actualPullRequests) {
            const mrFromDB = repo.pullRequests?.find((mrFromDB) => mrFromDB.number === actualPullRequest.number)

            console.log('logs mrFromDB', 'actualPullRequest.number', mrFromDB)
            const actualReviewers = actualPullRequest.requested_reviewers?.map(reviewer => reviewer.login);
            const addedReviewers = actualPullRequest.requested_reviewers?.filter(reviewer => !mrFromDB?.reviewers?.includes(reviewer.login)).map(reviewer => reviewer.login);
            const deletedReviewers = mrFromDB?.reviewers?.filter(reviewers => !actualReviewers.includes(reviewers));
            if (addedReviewers && addedReviewers.length > 0) {
                // todo: сщщбщить ревьерам что их добавили
            }
            if (deletedReviewers && deletedReviewers.length > 0) {
                // todo: сообщить владельцу мр что ревьер отказался
            }
            if (addedReviewers && addedReviewers.length > 0 || deletedReviewers && deletedReviewers.length > 0) {
                // todo: обновить инфу о ревьюерах в бд
                updatedRepo.reviewers = actualPullRequest.requested_reviewers.map((reviewer) => reviewer.login);
            }


            const approversFromDB  = mrFromDB?.approvers || []
            const actualApprovers = await getMRApprovedStatus(actualPullRequest.number, repoDetails?.owner, repoDetails?.name);
            const deletedApprovers = approversFromDB.filter(approver => !actualApprovers.includes(approver));
            const newApprovers = actualApprovers.filter(approver => !approversFromDB.includes(approver));
            if (newApprovers.length > 0) {
                // todo: сообщить владельцу мр что появился новый аппрув
            }
            if (deletedApprovers.length > 0) {
                // todo: сообщить владельцу мр что пропал аппрув
            }
            if (newApprovers.length > 0 || deletedApprovers.length > 0) {
                // todo: обновить инфу о ревьюерах в бд
                updatedRepo.approvers = actualApprovers
            }
            console.log('logs approvedStatuses: ', actualPullRequest.number, actualApprovers);
            // todo: обновить инфу об аппруверах[ в бд


            // если добавлся коммит но надо сообщить ревьюерам
            const gitHubCommits = await getCommitsFromMR(actualPullRequest)
            if (gitHubCommits.length > 0 ) {
                const lastActualCommitSha = gitHubCommits[gitHubCommits.length - 1].sha
                if (mrFromDB?.lastCommitSha ) {
                    if (lastActualCommitSha !== mrFromDB?.lastCommitSha) {
                        // todo: сообщить ревьюерам что в мр добавили коммит с названием!
                        updatedRepo.lastCommitSha = lastActualCommitSha
                    }
                } else {
                    updatedRepo.lastCommitSha = lastActualCommitSha
                }
            }

            // console.log('logs gitHubCommits:', actualPullRequest.number, gitHubCommits)
            // если появились новые ответы для ревьеров и владельцев надо сообщить об этом
            const gitHubComments = await getCommentsFromMR(actualPullRequest.url)
            const {newCommentsToAuthor, newCommentsToReviewers, newLastComment} = await getNewComments(actualPullRequest.url, actualReviewers, actualPullRequest.user.login, mrFromDB?.lastCommentId);
            if (newLastComment) {
                updatedRepo.lastCommentId = newLastComment
            }
            console.log('logs comments',actualPullRequest.number, ':', newCommentsToAuthor, newCommentsToReviewers)

            // todo: сообщаить автору и ревьерам о новый сообщениях - использовать body
            // console.log('logs gitHubComments:', actualPullRequest.number, gitHubComments)
            // parseInt
            console.log('logs updatedRepo of ',actualPullRequest.number, ':', updatedRepo)

            if (!mrFromDB) {
                console.log('logs этого мр нет в базе данных')
                try {
                    await reposCollection!.insertOne({
                        ...updatedRepo,
                        number: actualPullRequest.number,
                        updated_at: actualPullRequest.updated_at
                    });
                } catch (error) {
                    console.log("[Error] inserting merge request:", error);
                }
            } else if(Object.keys(updatedRepo).length > 0) {
                try {
                    // todo: update only mr
                    await reposCollection!.updateOne(
                        {number: actualPullRequest.number},
                        {
                            $set: {
                                updated_at: actualPullRequest.updated_at,
                                ...updatedRepo
                            }
                        }
                    );
                } catch (error) {
                    console.log("[Error] updateOne merge request:", error);
                }
            }
        }
    }
    // await pullUpdates();

    //
    // // const RequestedReviewsMRs = await getRequestedMRsForUser('fillinmar17')
    // const ReviewedMRs = await getReviewedMRsByUser('fillinmar17')
    // // console.log('logs RequestedMRs', RequestedReviewsMRs, 'ReviewedMRs', ReviewedMRs)
    // for (const mr of ReviewedMRs) {
    //     await checkMRStatusForReviewers(mr, 'fillinmar17')
    // }
    // console.log('logs assignedMRs', assignedMRs)
}

start()
