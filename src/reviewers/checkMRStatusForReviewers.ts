import axios from "axios";
import {MR} from "@/reviewers/getRequestedMRsForUser";
import {GITHUB_TOKEN} from "@/reviewers/index";
import {getCommitsFromMR} from "@/reviewers/getCommitsFromMR";
import {getCommentsFromMR} from "@/reviewers/getCommentsFromMR";
import {UserContext} from "@/database/addUser/helpers";

interface Comment {
    body: string;
    user: {
        login: string;
    };
    id: number
    in_reply_to_id?: number; // ID комментария, на который был дан ответ
}

export const getNewComments = async (apiUrl: string, reviewers: string[], author: string, lastCommentId?: number) =>{
    let newLastComment: number;
    const newCommentsToReviewers: Record<string, Comment[]> = {};
    const newCommentsToAuthor: Comment[] = [];
    const gitHubComments = await getCommentsFromMR(apiUrl)
    const commentsMap = new Map(gitHubComments.map(comment => [comment.id, comment]));
    for (const comment of gitHubComments) {
        if (lastCommentId && comment.id < lastCommentId ){
            continue
        }
        newLastComment = comment.id;
        if (comment.in_reply_to_id) {
            const commentAnsweredTo = commentsMap.get(comment.in_reply_to_id)
            if (commentAnsweredTo?.user.login ){
                if (reviewers.includes(commentAnsweredTo?.user.login)) {
                    newCommentsToReviewers[commentAnsweredTo.user.login].push(comment)
                }
                if (author == commentAnsweredTo?.user.login) {
                    newCommentsToAuthor.push(comment)
                }
            }
        } else {
            newCommentsToAuthor.push(comment)
        }
    }
    return {
        newCommentsToAuthor, newCommentsToReviewers, newLastComment
    }

}

export const checkMRStatusForReviewers = async (mr: MR, currentUser: string) => {
    try {
        const allComments = await getCommentsFromMR(mr.url)

        const commentsMap = new Map(allComments.map(comment => [comment.id, comment]));
        const newCommentsToShow: Comment[] = []

        commentsMap.forEach((comment) => {
            if (comment.in_reply_to_id) {
                const commentAnsweredTo = commentsMap.get(comment.in_reply_to_id)
                if (commentAnsweredTo?.user.login === currentUser) {
                    newCommentsToShow.push(comment)
                }
            }
        })

        let hasNewCommentsOrReviews = false;
        console.log('logs hasNewCommentsOrReviews:', hasNewCommentsOrReviews, 'newCommentsToShow', newCommentsToShow)
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log('[Error] in checkMRStatusForReviewers isAxiosError error.code:', error.code, 'error.message: ', error.message)
        }
        console.log('[Error] in checkMRStatusForReviewers', error)
    }
}