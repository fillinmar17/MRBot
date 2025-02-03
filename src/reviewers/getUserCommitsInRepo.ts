import axios from "axios";
import {GITHUB_TOKEN, MRInfoType} from "@/reviewers/index";

type CommitAuthorType = {
    name: string,
    email: string,
    date: string,
}

type CommitType = {
    author: CommitAuthorType,
    message: string,
}

type FilesInfoType = {
    node_id: string,
    commit: CommitType
}

export const getAuthorsOfChangedFiles = async (mrInfo: MRInfoType, file: string) => {
    const {REPO_OWNER, REPO_NAME} = mrInfo
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${file}`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });
    return response.data as FilesInfoType[];
}

export const getUserCommitsInRepo = async (REPO_OWNER: string, REPO_NAME: string, username: string, file: string) => {
    const response = await axios.get<FilesInfoType[]>(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?author=${username}&path=${file}&per_page=100`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });
    return response.data;
}
