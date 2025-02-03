import axios from "axios";
import {GITHUB_TOKEN} from "@/reviewers/index";

export type User = {
    login: string;
    id: number,
    html_url: string
}

export type PullRequestType = {
    url: string;
    html_url: string
    id: number;
    number: number;
    commits_url: string;
    review_comments_url: string;
    draft: boolean;
    title: string;
    user: User;
    state: 'open' | 'closed';
    created_at: Date,
    updated_at: Date,
    requested_reviewers: User[]
}

export const getPullRequests = async (repoUrl: string) => {
    try {
        const pulls = await axios.get(
            `${repoUrl}/pulls`,
            {headers: {Authorization: `token ${GITHUB_TOKEN}`}}
        );
        console.log('logs pulls', pulls)
        return pulls.data as PullRequestType[]
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log('[Error] in getPullRequests isAxiosError error.code:', error.code, 'error.message: ', error.message)
        } else {
            console.log('[Error] in getPullRequests', error)
        }
    }
    return [] as PullRequestType[]
}