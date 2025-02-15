import axios from "axios";
import {CodeOwner, getCodeOwnership, getCodeOwnershipInfo} from "./getCodeOwnership";

export const GITHUB_TOKEN = process.env['GITHUB_TOKEN'] || '';

export const MR_URL = 'https://github.com/fillinmar17/ReposForMR/pull/1';

interface Reviewer {
    username: string;
    load: number;   // количество мерж-реквестов на ревью у данного ревьюера
}

export type MRInfoType = {
    REPO_OWNER: string,
    REPO_NAME: string,
    PR_NUMBER: string,
}

const getMRInfoFromUrl = (mr: string): MRInfoType | undefined =>{
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const matches = mr.match(regex);

    if (matches && matches.length >= 4) {
        const REPO_OWNER = matches[1];
        const REPO_NAME = matches[2];
        const PR_NUMBER = matches[3];
        return { REPO_OWNER,REPO_NAME, PR_NUMBER}
    } else {
        // todo: throw error
        // console.error("The URL format is invalid.");
        return
    }
}

export type MRFilesTypes = {
    filename: string,
    status: string,
}
async function getChangedFiles(mrInfo: MRInfoType) {
    const {REPO_OWNER, REPO_NAME ,PR_NUMBER} = mrInfo
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/files`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });
    return response.data as MRFilesTypes[];
}

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

async function getAuthorsOfChangedFiles(mrInfo: MRInfoType, file: string) {
    const {REPO_OWNER, REPO_NAME} = mrInfo
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${file}`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });
    return response.data as FilesInfoType[];
}

interface Collaborator {
    login: string;
    id: number;
    avatar_url: string;
    html_url: string;
}
async function getCollaborators(mrInfo: MRInfoType): Promise<Collaborator[]|undefined>  {
    const {REPO_OWNER, REPO_NAME} = mrInfo
    try {
        const response = await axios.get<Collaborator[]>(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/collaborators`, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error fetching collaborators: ${error.message}`);
        } else {
            console.error(`Unexpected error: ${error}`);
            // throw new Error('An unexpected error occurred');
        }
        return
    }
}

const selectBestReviewers = (editorsTheSameFile: Record<string, number>, codeOwners?: CodeOwner[], collaborators?: Collaborator[]): string[] => {
    if (!collaborators){
        return []
    }
    const uniqueLoginReviewers = new Set<string>();
    const futureReviewers: string[] = []

    codeOwners?.forEach(owner => {
        owner.name && uniqueLoginReviewers.add(owner.name);
    });

    Object.keys(editorsTheSameFile).forEach(login => {
        uniqueLoginReviewers.add(login);
    });
    const collaboratorLogins = new Set<string>(collaborators.map(collaborator => collaborator.login));
    console.log('logs collaboratorLogins', collaboratorLogins, 'uniqueLoginReviewers', uniqueLoginReviewers, 'editorsTheSameFile', codeOwners)

    uniqueLoginReviewers.forEach(login => {
        if (collaboratorLogins.has(login)) {
            futureReviewers.push(login);
        }
    })

    console.log('logs futureReviewers', futureReviewers)

    return futureReviewers;
}

async function getReviewersForFiles(mrInfo: MRInfoType, changedFiles: MRFilesTypes[], codeOwners: CodeOwner[] | undefined) {
    const editorsTheSameFile: Record<string, number> = {};
    for (const changedFile of changedFiles) {
        const commits = await getAuthorsOfChangedFiles(mrInfo, changedFile.filename)
        commits.forEach(commit => {
            console.log('logs commit.commit.author', commit.commit.author, 'changedFile.filename', changedFile.filename)
            const author = commit.commit.author.name;
            if (author) {
                editorsTheSameFile[author] = (editorsTheSameFile[author] || 0) + 1;
            }
        });
    }

    const collaborators = await getCollaborators(mrInfo);
    return selectBestReviewers(editorsTheSameFile, codeOwners, collaborators)
}

async function getCurrentReviewers(MRInfo: MRInfoType) {
    const {REPO_OWNER, REPO_NAME ,PR_NUMBER} = MRInfo;
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/requested_reviewers`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });

    return response.data.users;
}

// todo: рассчитать нагрузку ревьюеров
// async function getReviewerLoad(reviewers: Reviewer[]) {
//     const loadMap: Record<string, number> = {};
//     for (let reviewer of reviewers) {
//         // todo
//         // Здесь вы можете получить количество открытых PR для каждого ревьюера
//         // Например, отправить запрос на получение всех открытых PR и
//         // отфильтровать по автору.
//         loadMap[reviewer.username] = reviewer.load;
//     }
//     return loadMap;
// }

export const addReviewersToPR = async (mrInfo: MRInfoType, selectedReviewers: string[]):Promise<string[]|undefined> => {
    const {REPO_OWNER, REPO_NAME ,PR_NUMBER} = mrInfo;
    console.log('logs trying to add Reviewers to PR', selectedReviewers)
    try {
        const response = await axios.post(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/requested_reviewers`, {
            reviewers: selectedReviewers
            // reviewers: ['vasiaPupkin52']
        }, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        // todo: уведомить что успешно назначили ревьюеров
        console.log('logs successfuly added reviewers', response.data.requested_reviewers.map((reviewers)=>reviewers.login));
        return response.data.requested_reviewers.map((reviewers)=>reviewers.login) as string[]
    } catch(error) {
        // todo: уведомить что что-то пошло не так
        console.error('logs error',  error);
        return undefined;
    }
}

// todo: обернуть все в трай/кетч
export async function assignReviewers(mr: string) {
    const mrInfo = getMRInfoFromUrl(mr)
    if (!mrInfo) {
        // todo: уведомить что неверная ссылка
        return;
    }
    const changedFiles = await getChangedFiles(mrInfo);

    const codeOwnershipEntries = await getCodeOwnershipInfo(mrInfo)

    const codeOwners = await getCodeOwnership(changedFiles, codeOwnershipEntries);

    const futureReviewers = await getReviewersForFiles(mrInfo, changedFiles, codeOwners);
    // todo: use it
    const currentReviewers = await getCurrentReviewers(mrInfo);

    const addedReviewers = await addReviewersToPR(mrInfo, futureReviewers);


    if (addedReviewers && addedReviewers.length && codeOwnershipEntries && codeOwnershipEntries.codeOwnership && codeOwnershipEntries.codeOwnership.length) {
        const {codeOwnership} = codeOwnershipEntries
        const owners = codeOwnership
            .flatMap(entry => entry.owners)
            .filter((owner): owner is CodeOwner => owner !== undefined);

        const uniqueOwners = new Set(owners);

        addedReviewers.forEach(reviewer => {
            uniqueOwners.forEach(owner => {
                if (owner.name === reviewer) {
                    console.log('send telegramm message to owner', owner.name)
                    // todo: send notification
                }
            })
        })
    }

}

