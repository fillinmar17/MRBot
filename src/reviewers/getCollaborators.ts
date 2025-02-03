import axios from "axios";
import {API_GITHUB_URL, GITHUB_TOKEN, MRFilesTypes, MRInfoType, sendMRNotFoundMessage} from "@/reviewers/index";

interface Collaborator {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
}

export const getCollaborators = async (mrInfo: MRInfoType) => {
    const {REPO_OWNER, REPO_NAME, PR_NUMBER} = mrInfo
    let collaborators: Collaborator[] = []
    try {
        const response = await axios.get<Collaborator[]>(
            `${API_GITHUB_URL}repos/${REPO_OWNER}/${REPO_NAME}/collaborators`,
            {headers: {Authorization: `token ${GITHUB_TOKEN}`}})
        collaborators = response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`[ERROR] Error fetching collaborators: ${error.message}`);
        } else {
            console.error(`[ERROR] Unexpected error: ${error}`);
        }
    }
    return collaborators
}