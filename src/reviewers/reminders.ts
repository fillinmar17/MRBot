import {MongoDbService, RepositoryDocument} from "@/database/MongoDbService";
import {getMRApprovedStatus} from "@/reviewers/getMRApprovedStatus";
import {ReactMessage} from "@/bot/react/core/message/message";
import {Reminder} from "@/bot/Components/Reminder";
import {getChangedFiles} from "@/reviewers/getChangedFiles";
import {getPullRequests} from "@/reviewers/getPullRequests";
import {getRepoDetailsFromUrl} from "@/logic/getRepoDetailsFromUrl";

export const checkUnreviewedPRs = async (mongoService: MongoDbService) => {
    console.log('logs in checkUnreviewedPRs',)
    try {
        const reposFromDB = await mongoService.fetchRepositories() as RepositoryDocument[];

        for (const repo of reposFromDB) {
            const pullRequestsFromDB = await mongoService.fetchPullRequests(repo._id);
            const actualPullRequests = await getPullRequests(repo.url);
            if (!actualPullRequests || actualPullRequests.length === 0) {
                continue
            }
            const repoDetails = getRepoDetailsFromUrl(actualPullRequests[0].url)
            if (!repoDetails) {
                continue
            }

            for (const actualPullRequest of actualPullRequests) {
                const mrFromDB = pullRequestsFromDB?.find((mrFromDB) => mrFromDB.number === actualPullRequest.number)

                const approvers = await getMRApprovedStatus(actualPullRequest.number, repoDetails.owner, repoDetails.name);
                const unreviewedReviewers = mrFromDB?.reviewers.filter((reviewer: string) => !approvers.includes(reviewer));

                if (unreviewedReviewers.length === 0) continue;

                const changedFiles = await getChangedFiles({
                    PR_NUMBER: actualPullRequest.number.toString(),
                    REPO_NAME: repoDetails.name,
                    REPO_OWNER: repoDetails.owner
                });

                let additions = 0;
                let deletions = 0;
                changedFiles.files.forEach(file => {
                    additions += file.additions;
                    deletions += file.deletions;
                });

                for (const reviewer of unreviewedReviewers) {
                    const userId = await mongoService.findUser(reviewer);
                    if (!userId) continue;

                    await ReactMessage.describe('reminder', Reminder).send(
                        '415887410',
                        {
                            repoName: repoDetails.name,
                            repoHref: repo.href,
                            mrNumber: actualPullRequest.number,
                            mrUrl: actualPullRequest.html_url,
                            mrName: actualPullRequest.title,
                            fileNumberChanged: changedFiles.files.length,
                            codeLinesAdded: additions,
                            codeLinesRemoved: deletions,
                            approversCount: approvers.length,
                            author: actualPullRequest.user,

                        }
                    );
                }
            }
        }
    } catch (error) {
        console.log('[ERROR] while checkUnreviewedPRs', error)
    }
}; 