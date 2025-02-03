import axios from "axios";
import {GITHUB_TOKEN} from "@/reviewers/index";

interface User {
    id: number;
    username: string;
}
interface pullRequestUrls {
    url: string;
    html_url: string;
    diff_url: string;
}

export interface MR {
    id: number;
    title: string;
    url: string;
    number: number;
    state: 'open' | 'closed';
    assignees: User[];
    reviewers: User[];
    updated_at: Date;
    created_at: Date,
    pull_request: pullRequestUrls;
}

// чтобы напомнить посмотреть МР или сказать, что тебя назначили
export const getRequestedMRsForUser = async(userId: string) => {
    const response = await axios.get('https://api.github.com/search/issues', {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        params: {
           q: `is:pr is:open review-requested:${userId}`,
        },
    });

    return response.data.items as MR[];
}

// чтобы узнать что на комменты юзера ответили
export const getReviewedMRsByUser = async(userId: string) => {
    const response = await axios.get('https://api.github.com/search/issues', {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
        params: {
            q: `is:pr is:open reviewed-by:${userId}`,
        },
    });

    return response.data.items as MR[];
}