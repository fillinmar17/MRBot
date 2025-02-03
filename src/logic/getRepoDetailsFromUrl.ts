export const getRepoDetailsFromUrl = (url: string): { owner: string; name: string } | null => {
    const regex = /https:\/\/api\.github\.com\/repos\/([^/]+)\/([^/]+)/;
    const match = url.match(regex);
    if (match && match.length === 3) {
        const owner = match[1];
        const name = match[2];

        return {owner, name};
    }
    return null;
}