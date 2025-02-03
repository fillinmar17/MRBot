import {MongoDbService, PullRequestDocument, RepositoryDocument} from "@/database/MongoDbService";
import {getPullRequests} from "@/reviewers/getPullRequests";
import {getMRApprovedStatus} from "@/reviewers/getMRApprovedStatus";
import {getChangedFiles} from "@/reviewers/getChangedFiles";
import {ReactMessage} from "@/bot/react/core/message/message";
import {AddedAsReviewer} from "@/bot/Components/AddedAsReviewer";
import {getCommitsFromMR} from "@/reviewers/getCommitsFromMR";
import {NewCommits} from "@/bot/Components/NewCommits";
import {getNewComments} from "@/reviewers/getNewComments";
import {Answers, AnswerType} from "@/bot/Components/Answers";
import {getRepoDetailsFromUrl} from "@/logic/getRepoDetailsFromUrl";

export const updatingInfo = async (mongoService: MongoDbService) => {
    const reposFromDB = await mongoService.fetchRepositories() as RepositoryDocument[]
    const repoIds = reposFromDB.map(repo => repo._id)
    if (!repoIds.length) {
        return
    }

    for (const repoFromDB of reposFromDB) {
        let updatedRepo: Omit<PullRequestDocument, 'repositoryId'> = {};
        const pullRequestsFromDB = await mongoService.fetchPullRequests(repoFromDB._id)
        const actualPullRequests = await getPullRequests(repoFromDB.url);
        if (!actualPullRequests || actualPullRequests.length === 0) {
            continue
        }
        const repoDetails = getRepoDetailsFromUrl(actualPullRequests[0].url)
        if (!repoDetails) {
            continue
        }
        for (const actualPullRequest of actualPullRequests) {
            const mrFromDB = pullRequestsFromDB?.find((mrFromDB) => mrFromDB.number === actualPullRequest.number)
            const actualReviewers = actualPullRequest.requested_reviewers?.map(reviewer => reviewer.login);
            const addedReviewers = actualPullRequest.requested_reviewers?.filter(reviewer => !mrFromDB?.reviewers?.includes(reviewer.login)).map(reviewer => reviewer.login);
            const deletedReviewers = mrFromDB?.reviewers?.filter(reviewers => !actualReviewers.includes(reviewers));

            const actualApprovers = await getMRApprovedStatus(actualPullRequest.number, repoDetails?.owner, repoDetails?.name);

            const changedFiles = await getChangedFiles({
                PR_NUMBER: actualPullRequest.number.toString(),
                REPO_NAME: repoDetails.name,
                REPO_OWNER: repoDetails.owner
            })
            let additions = 0
            let deletions = 0

            changedFiles.files.forEach(file => {
                additions += file.additions
                deletions += file.deletions
            })

            if (addedReviewers && addedReviewers.length > 0) {
                for (const reviewer of addedReviewers) {
                    const userId = await mongoService.findUser(reviewer)
                    if (userId) {
                        await ReactMessage.describe('addedAsReviewer', AddedAsReviewer).send(
                            userId,
                            {
                                mr: {
                                    repoName: repoDetails.name,
                                    repoHref: repoFromDB.href,
                                    mrNumber: actualPullRequest.number,
                                    mrUrl: actualPullRequest.html_url,
                                    mrName: actualPullRequest.title,
                                    fileNumberChanged: changedFiles.files.length,
                                    codeLinesAdded: additions,
                                    codeLinesRemoved: deletions,
                                    approversCount: actualApprovers.length,
                                    author: actualPullRequest.user,
                                }
                            },
                        );
                    }
                }
            }
            if (deletedReviewers && deletedReviewers.length > 0) {
                // todo: сообщить владельцу мр что ревьер отказался
            }
            if (addedReviewers && addedReviewers.length > 0 || deletedReviewers && deletedReviewers.length > 0) {
                updatedRepo.reviewers = actualPullRequest.requested_reviewers.map((reviewer) => reviewer.login);
            }

            const approversFromDB = mrFromDB?.approvers || []
            const deletedApprovers = approversFromDB.filter(approver => !actualApprovers.includes(approver));
            const newApprovers = actualApprovers.filter(approver => !approversFromDB.includes(approver));

            if (newApprovers.length > 0 || deletedApprovers.length > 0) {
                updatedRepo.approvers = actualApprovers
            }

            const gitHubCommits = await getCommitsFromMR(actualPullRequest)
            if (gitHubCommits.length > 0) {
                const lastActualCommit = gitHubCommits[gitHubCommits.length - 1]
                if (mrFromDB?.lastCommitSha && lastActualCommit) {
                    if (lastActualCommit.sha !== mrFromDB?.lastCommitSha) {
                        updatedRepo.lastCommitSha = lastActualCommit.sha
                        for (const reviewer of mrFromDB?.reviewers) {
                            const userId = await mongoService.findUser(reviewer)
                            if (userId) {
                                await ReactMessage.describe('NewCommits', NewCommits).send(
                                    userId,
                                    {
                                        mr: {
                                            repoName: repoDetails.name,
                                            repoHref: repoFromDB.href,
                                            mrNumber: actualPullRequest.number,
                                            mrUrl: actualPullRequest.html_url,
                                            mrName: actualPullRequest.title,
                                            fileNumberChanged: changedFiles.files.length,
                                            codeLinesAdded: additions,
                                            codeLinesRemoved: deletions,
                                            approversCount: actualApprovers.length,
                                            author: actualPullRequest.user,
                                        },
                                        name: lastActualCommit.commit.message
                                    },
                                );
                            }
                        }
                    } else {
                        updatedRepo.lastCommitSha = lastActualCommit.sha
                    }
                }

                const {
                    newCommentsToAuthor,
                    newCommentsToReviewers,
                    newLastComment
                } = await getNewComments(actualPullRequest.url, actualReviewers, actualPullRequest.user.login, mrFromDB?.lastCommentId);
                if (newLastComment) {
                    updatedRepo.lastCommentId = newLastComment
                }

                if (newApprovers.length > 0 || deletedApprovers.length > 0 || newCommentsToAuthor.length > 0) {
                    let answers: Record<string, AnswerType[]> = {}
                    newApprovers.forEach(approver => {
                        answers[approver] = answers[approver] || [];
                        answers[approver].push({
                            isApprove: true,
                            link: actualPullRequest.html_url
                        });
                    })
                    deletedApprovers.forEach(approver => {
                        answers[approver] = answers[approver] || [];
                        answers[approver].push({
                            isApprove: false,
                            link: actualPullRequest.html_url
                        });
                    })
                    newCommentsToAuthor.forEach(comment => {
                        const answerAuthor = comment.user.login
                        answers[answerAuthor] = answers[answerAuthor] || [];
                        answers[answerAuthor].push({
                            text: comment.body,
                            link: comment.html_url
                        });
                    })
                    const userId = await mongoService.findUser(repoDetails.owner)
                    if (userId) {
                        await ReactMessage.describe('Answers', Answers).send(
                            userId,
                            {
                                mr: {
                                    repoName: repoDetails.name,
                                    repoHref: repoFromDB.href,
                                    mrNumber: actualPullRequest.number,
                                    mrUrl: actualPullRequest.html_url,
                                    mrName: actualPullRequest.title,
                                    fileNumberChanged: changedFiles.files.length,
                                    codeLinesAdded: additions,
                                    codeLinesRemoved: deletions,
                                    approversCount: actualApprovers.length,
                                    author: actualPullRequest.user,
                                },
                                answers
                            },
                        );
                    }
                }

                if (!mrFromDB) {
                    await mongoService.createPullRequest({
                        ...updatedRepo,
                        number: actualPullRequest.number,
                        updated_at: actualPullRequest.updated_at,
                        repositoryId: repoFromDB._id
                    })
                } else if (Object.keys(updatedRepo).length > 0) {
                    await mongoService.updatePullRequest(
                        mrFromDB._id,
                        {
                            updated_at: actualPullRequest.updated_at,
                            ...updatedRepo
                        }
                    )
                }
            }
        }

    }
}
