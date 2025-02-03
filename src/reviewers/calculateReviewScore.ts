import {getUserCommitsInRepo} from "@/reviewers/getUserCommitsInRepo";
import {getReviewRequests} from "@/reviewers/getReviewRequests";

interface ReviewerScore {
    username: string;
    expertise: number;
    currentLoad: number; // 0-1 (1 - минимальная нагрузка)
}

async function calculateReviewerScore(
    username: string,
    userChangesCountInChangedFiles: number,
    totalCommitsInChanges: number,
): Promise<ReviewerScore> {
    // Экспертиза: как часто пользователь менял файлы из МР
    const expertise = totalCommitsInChanges > 0 ? Math.min(userChangesCountInChangedFiles / totalCommitsInChanges, 1) : 0;
    // Текущая нагрузка
    const currentLoad = 1 - Math.min(await getReviewRequests(username) / 5, 1);
    return {
        username,
        expertise,
        currentLoad,
    };
}

const getAuthorsChangesOfChangedFiles = async (
    users: string[], changedFiles: string[], REPO_OWNER: string, REPO_NAME: string) => {
    const usersChangesCountInChangedFiles: Record<string, number> = {};
    let totalCommitsInChanges = 0

    for (const user of users) {
        for (const file of changedFiles) {
            const count = usersChangesCountInChangedFiles[user] || 0;
            const commits = await getUserCommitsInRepo(REPO_OWNER, REPO_NAME, user, file);
            if (commits.length > 0) {
                usersChangesCountInChangedFiles[user] = count + commits.length;
                totalCommitsInChanges += commits.length;
            }
        }
    }
    return {usersChangesCountInChangedFiles, totalCommitsInChanges}
}

export const selectScoredReviewers = async (
    repo: string,
    owner: string,
    potentialReviewers: string[],
    changedFiles: string[],
): Promise<string[]> => {
    const {
        usersChangesCountInChangedFiles,
        totalCommitsInChanges
    } = await getAuthorsChangesOfChangedFiles(potentialReviewers, changedFiles, owner, repo)
    
    const scores = await Promise.all(
        potentialReviewers.map(user =>
            calculateReviewerScore(user, usersChangesCountInChangedFiles[user] || 0, totalCommitsInChanges)
        )
    );

    // Sort by expertise to find the most experienced reviewer
    const sortedByExpertise = [...scores].sort((a, b) => b.expertise - a.expertise);
    const mostExperiencedReviewer = sortedByExpertise[0];

    // Remove the most experienced reviewer from the pool
    const remainingReviewers = scores.filter(r => r.username !== mostExperiencedReviewer.username);
    
    // Sort remaining reviewers by current load (least loaded first)
    const sortedByLoad = remainingReviewers.sort((a, b) => b.currentLoad - a.currentLoad);
    const leastLoadedReviewer = sortedByLoad[0];

    // Return exactly 2 reviewers: most experienced and least loaded
    return [mostExperiencedReviewer.username, leastLoadedReviewer.username];
}


