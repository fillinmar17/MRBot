import {GITHUB_TOKEN} from "@/reviewers/index";

interface PullRequest {
    id: number;
    title: string;
    html_url: string;
    repository: {
        name: string;
        owner: string;
    };
}

export const getReviewRequests = async (
    reviewerUsername: string,
): Promise<number> => {
    const apiUrl = 'https://api.github.com/search/issues';

    const searchQuery = `is:pr is:open review-requested:${reviewerUsername}`;

    const url = `${apiUrl}?q=${encodeURIComponent(searchQuery)}&per_page=100`;

    try {
        const response = await fetch(url, {
            headers: {Authorization: `token ${GITHUB_TOKEN}`},
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        const pullRequests: PullRequest[] = data.items.map((item: any) => ({
            id: item.id,
            title: item.title,
            html_url: item.html_url,
            repository: {
                name: item.repository_url.split('/').pop() || '',
                owner: item.repository_url.split('/').slice(-2, -1)[0] || ''
            }
        }));

        return data.total_count;
    } catch (error) {
        console.error('Error fetching pull requests:', error);
        throw error;
    }
}
