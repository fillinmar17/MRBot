import axios from "axios";
import {GITHUB_TOKEN} from "@/reviewers/index";

interface Comment {
    body: string;
    user: {
        login: string;
    };
    id: number
    in_reply_to_id?: number; // ID комментария, на который был дан ответ
}

export const getCommentsFromMR = async(apiUrl: string)=>{
    try {
        const commentsResponse = await axios.get(
            `${apiUrl}/comments`,
            {
                headers: {
                    Authorization: `token ${GITHUB_TOKEN}`,
                },
            }
        );
        return  commentsResponse.data as Comment[]
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log('[Error] in getCommentsFromMR isAxiosError error.code:', error.code, 'error.message: ', error.message)
        }
        console.log('[Error] in getCommentsFromMR', error)
        return [] as Comment[]
    }
}