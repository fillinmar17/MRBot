import axios from "axios";
import {GITHUB_TOKEN, MRInfoType} from "@/reviewers/index";

interface GitHubUser {
    login: string;
    id: number;
    avatar_url: string;
    url: string;
    html_url: string;
}

interface PullRequest {
    id: number;
    number: number;
    title: string;
    user: GitHubUser;
    assignees: GitHubUser[];
}

export const getPullRequestInfo = async(MRInfo: MRInfoType)=>  {
    const {REPO_OWNER, REPO_NAME, PR_NUMBER} = MRInfo;
    const response = await axios.get<PullRequest>(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });

    return response.data;
}