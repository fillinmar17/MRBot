import {Communicator} from './bot/communicator';

import {getDefaultApiToken, getMongoDBUrl} from "./bot/env";
import axios from "axios";
import {assignReviewers} from "./reviewers";
import 'dotenv/config'
import {addUser} from "@/database/addUser/addUser";
import {MongoDbService} from "@/database/MongoDbService";

const communicator = Communicator.getDefault();
const mineTelegramAcc = '415887410';

const pullUpdates = async (mongoService: MongoDbService) => {
    try {
        const result = await communicator.pullUpdates();
        for (const message of result) {
            if (!message.user?.id) continue;
            const chatId = message.chat.id;
            const text = message.type === 'message' ? message.body || '' : '';
            const userId = message.user.id;
            const userInDB = await mongoService.findUser(userId);
            console.log('logs userInDB', userInDB, 'text', text,)

            if (!userInDB) {
                await addUser(chatId, text, mongoService.addUser)
            } else if (message.type === 'message' && message.body) {
                assignReviewers(message.body, chatId);
            }
        }

        console.log('Result from communicator.pullUpdates:', result);
    } catch (error) {
        console.error('Error in pullUpdates:', error);
    }

    setTimeout(()=>pullUpdates(mongoService), 1000);
};

const start = async () => {
    // TODO: if telegram bot
    await axios.get(`https://api.telegram.org/bot${getDefaultApiToken()}/deleteWebhook`);

    const mongoService = new MongoDbService(getMongoDBUrl(), 'myProject');
    await mongoService.connect();


    // TODO checking repos every 5 minutes
    // const reposFromDB = await mongoService.fetchRepositories()
    // const repoIds = reposFromDB.map(repo => repo._id)
    //
    // console.log('logs reposFromDB', reposFromDB, 'repoIds', repoIds,)
    // for (const repoFromDB of reposFromDB) {
    //     let updatedRepo: UpdatedPullRequestsInfoType = {};
    //     const pullRequestsFromDB = await mongoService.fetchPullRequests(repoFromDB._id)
    //     console.log('logs pullRequestsFromDB: ', pullRequestsFromDB)
    //     const actualPullRequests = await getPullRequests(repoFromDB.url);
    //     if (!actualPullRequests || actualPullRequests.length === 0) {
    //         continue
    //     }
    //     const repoDetails = getRepoDetailsFromUrl(actualPullRequests[0].url)
    //     if (!repoDetails) {
    //         continue
    //     }
    //     for (const actualPullRequest of actualPullRequests) {
    //         const mrFromDB = pullRequestsFromDB?.find((mrFromDB) => mrFromDB.number === actualPullRequest.number)
    //
    //         console.log('logs mrFromDB', 'actualPullRequest.number', mrFromDB)
    //         const actualReviewers = actualPullRequest.requested_reviewers?.map(reviewer => reviewer.login);
    //         const addedReviewers = actualPullRequest.requested_reviewers?.filter(reviewer => !mrFromDB?.reviewers?.includes(reviewer.login)).map(reviewer => reviewer.login);
    //         const deletedReviewers = mrFromDB?.reviewers?.filter(reviewers => !actualReviewers.includes(reviewers));
    //         if (addedReviewers && addedReviewers.length > 0) {
    //             // todo: сщщбщить ревьерам что их добавили
    //         }
    //         if (deletedReviewers && deletedReviewers.length > 0) {
    //             // todo: сообщить владельцу мр что ревьер отказался
    //         }
    //         if (addedReviewers && addedReviewers.length > 0 || deletedReviewers && deletedReviewers.length > 0) {
    //             // todo: обновить инфу о ревьюерах в бд
    //             updatedRepo.reviewers = actualPullRequest.requested_reviewers.map((reviewer) => reviewer.login);
    //         }
    //
    //         const approversFromDB  = mrFromDB?.approvers || []
    //         const actualApprovers = await getMRApprovedStatus(actualPullRequest.number, repoDetails?.owner, repoDetails?.name);
    //         const deletedApprovers = approversFromDB.filter(approver => !actualApprovers.includes(approver));
    //         const newApprovers = actualApprovers.filter(approver => !approversFromDB.includes(approver));
    //         if (newApprovers.length > 0) {
    //             // todo: сообщить владельцу мр что появился новый аппрув
    //         }
    //         if (deletedApprovers.length > 0) {
    //             // todo: сообщить владельцу мр что пропал аппрув
    //         }
    //         if (newApprovers.length > 0 || deletedApprovers.length > 0) {
    //             // todo: обновить инфу о ревьюерах в бд
    //             updatedRepo.approvers = actualApprovers
    //         }
    //         console.log('logs approvedStatuses: ', actualPullRequest.number, actualApprovers);
    //         // todo: обновить инфу об аппруверах[ в бд
    //
    //         // если добавлся коммит но надо сообщить ревьюерам
    //         const gitHubCommits = await getCommitsFromMR(actualPullRequest)
    //         if (gitHubCommits.length > 0 ) {
    //             const lastActualCommitSha = gitHubCommits[gitHubCommits.length - 1].sha
    //             if (mrFromDB?.lastCommitSha ) {
    //                 if (lastActualCommitSha !== mrFromDB?.lastCommitSha) {
    //                     // todo: сообщить ревьюерам что в мр добавили коммит с названием!
    //                     updatedRepo.lastCommitSha = lastActualCommitSha
    //                 }
    //             } else {
    //                 updatedRepo.lastCommitSha = lastActualCommitSha
    //             }
    //         }
    //
    //         const {newCommentsToAuthor, newCommentsToReviewers, newLastComment} = await getNewComments(actualPullRequest.url, actualReviewers, actualPullRequest.user.login, mrFromDB?.lastCommentId);
    //         if (newLastComment) {
    //             updatedRepo.lastCommentId = newLastComment
    //         }
    //         console.log('logs comments',actualPullRequest.number, ':', newCommentsToAuthor, newCommentsToReviewers)
    //
    //         // todo: сообщаить автору и ревьерам о новый сообщениях - использовать body
    //         console.log('logs updatedRepo of ',actualPullRequest.number, ':', updatedRepo)
    //
    //         if (!mrFromDB) {
    //             console.log('logs этого мр нет в базе данных')
    //             await mongoService.createPullRequest({
    //                         ...updatedRepo,
    //                         number: actualPullRequest.number,
    //                         updated_at: actualPullRequest.updated_at,
    //                         repositoryId: repoFromDB._id
    //             })
    //         } else if(Object.keys(updatedRepo).length > 0) {
    //             const res = await mongoService.updatePullRequest(
    //                 mrFromDB._id,
    //                 {
    //                     updated_at: actualPullRequest.updated_at,
    //                     ...updatedRepo
    //                 }
    //             )
    //             console.log('logs update pullrequest res', res)
    //         }
    //     }
    // }


    await pullUpdates(mongoService);
}

start()
