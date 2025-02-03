import {getCommentsFromMR} from "@/reviewers/getCommentsFromMR";

interface Comment {
    body: string;
    user: {
        login: string;
    };
    id: number
    html_url: string
    in_reply_to_id?: number; // ID комментария, на который был дан ответ
}

export const getNewComments = async (apiUrl: string, reviewers: string[], author: string, lastCommentId?: number) =>{
    let newLastComment: number | undefined;
    const newCommentsToReviewers: Record<string, Comment[]> = {};
    const newCommentsToAuthor: Comment[] = [];
    const gitHubComments = await getCommentsFromMR(apiUrl)
    const commentsMap = new Map(gitHubComments.map(comment => [comment.id, comment]));
    for (const comment of gitHubComments) {
        console.log('logs lastCommentId', lastCommentId, 'comment.id', 'commentsMap', commentsMap )
        if (lastCommentId && comment.id <= lastCommentId ){
            continue
        }
        newLastComment = comment.id;
        if (comment.in_reply_to_id) {
            const commentAnsweredTo = commentsMap.get(comment.in_reply_to_id)
            if (commentAnsweredTo?.user.login ){
                if (reviewers.includes(commentAnsweredTo.user.login)) {
                    if (newCommentsToReviewers[commentAnsweredTo.user.login]) {
                        newCommentsToReviewers[commentAnsweredTo.user.login].push(comment)
                    } else {
                        newCommentsToReviewers[commentAnsweredTo.user.login] = [comment]
                    }
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
