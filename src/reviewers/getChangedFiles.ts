import axios from "axios";
import {API_GITHUB_URL, GITHUB_TOKEN, MRFilesTypes, MRInfoType, sendMRNotFoundMessage} from "@/reviewers/index";

export const getChangedFiles = async (mrInfo: MRInfoType, mr?: string, chatId?: string) => {
    const {REPO_OWNER, REPO_NAME, PR_NUMBER} = mrInfo
    let files: MRFilesTypes[] = []
    try {
        const response = await axios.get(`${API_GITHUB_URL}repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/files`, {
            headers: {Authorization: `token ${GITHUB_TOKEN}`},
        })
        files = response.data as MRFilesTypes[];
    } catch (error) {
        if (mr && chatId && axios.isAxiosError(error) && error.response?.status == 404) {
            await sendMRNotFoundMessage(chatId, mr);
        } else {
            console.log('[ERROR] Unexpected error in getChangedFiles:', error);
            throw error
        }
    }
    return {files}
}