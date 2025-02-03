import {GITHUB_TOKEN, MRInfoType} from "@/reviewers/index";
import axios from "axios";
import {getPullRequestInfo} from "@/reviewers/getPullRequestInfo";

interface GitHubUser {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
    html_url: string;
}

const getCurrentReviewers = async (MRInfo: MRInfoType) => {
    const {REPO_OWNER, REPO_NAME, PR_NUMBER} = MRInfo;
    const response = await axios.get<{
        users: GitHubUser[]
    }>(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/requested_reviewers`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });
    return response.data.users.map((user) => user.login);
}

const getPRAuthorAndAssigners = async (MRInfo: MRInfoType): Promise<string[]> => {
    const info = await getPullRequestInfo(MRInfo);
    const authorAndAssigners: string[] = []
    if (info.user) {
        authorAndAssigners.push(info.user.login);
    }
    if (info.assignees.length > 0) {
        const assignersLogin = info.assignees.map(assignee => assignee.login)
        authorAndAssigners.push(...assignersLogin);
    }
    return authorAndAssigners;
}

export const getPotentialReviewers = async (mrInfo: MRInfoType, collaborators: string[]) => {
    const currentReviewers = await getCurrentReviewers(mrInfo);
    const authorAndAssigners = await getPRAuthorAndAssigners(mrInfo);
    return collaborators.filter((collaborator) =>
        !currentReviewers.includes(collaborator) && !authorAndAssigners.includes(collaborator));
}