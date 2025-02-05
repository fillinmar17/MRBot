// import axios from 'axios';
import {getDefaultApiToken} from "../bot/env";
import axios from "axios";

// todo: hide it
const GITHUB_TOKEN = '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';  // замените на свой токен
// const REPO_OWNER = 'owner';                  // замените на владельца репозитория
// const REPO_NAME = 'repository';              // замените на имя репозитория

export const MR_URL = 'https://github.com/fillinmar17/MRBot/pull/1';

interface Reviewer {
    username: string;
    load: number;   // количество мерж-реквестов на ревью у данного ревьюера
}

export type MRInfoType = {
    REPO_OWNER: string,
    REPO_NAME: string,
    PR_NUMBER: string,
}
const getMRInfo = (mr: string): MRInfoType | undefined =>{
    const regex = /https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/;
    const matches = mr.match(regex);
    console.log('logs matches', matches)

    if (matches?.length >= 4) {
        // Extract the REPO_OWNER, REPO_NAME, and prNumber from the matches
        const REPO_OWNER = matches[1]; // The first captured group is the repository owner
        const REPO_NAME = matches[2];   // The second captured group is the repository name
        const PR_NUMBER = matches[3];     // The third captured group is the pull request number

        // Log the outcomes or use them as needed
        console.log(`REPO_OWNER: ${REPO_OWNER}`);
        console.log(`REPO_NAME: ${REPO_NAME}`);
        console.log(`prNumber: ${PR_NUMBER}`);
        return { REPO_OWNER,REPO_NAME, PR_NUMBER}
    } else {
        // console.error("The URL format is invalid.");
        return
    }
}

async function getPullRequest(mrInfo: MRInfoType) {
    const {REPO_OWNER, REPO_NAME ,PR_NUMBER} = mrInfo
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });
    console.log('logs response.data', response.data)
    return response.data;
}

async function getChangedFiles(mrInfo: MRInfoType) {
    const {REPO_OWNER, REPO_NAME ,PR_NUMBER} = mrInfo
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/files`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });

    console.log('logs in getChangedFiles response.data', response.data)
    return response.data;
}

async function getReviewersForFiles(changedFiles: any[]) {
    const fileOwners: Record<string, string[]> = {};
    // Здесь вы можете использовать свою логику для определения владельцев файлов
    // Например, читая файл CODEOWNERS или другое местоположение.

    // Примерная логика:
    for (let file of changedFiles) {
        // todo: insert code here
        // Определите владельца файла (это требует настройки вашей логики)
        // const owners = /* ваша логика для нахождения владельцев файлов */;
        // fileOwners[file.filename] = owners;
    }
    return fileOwners;
}

async function getCurrentReviewers(MRInfo: MRInfoType) {
    const {REPO_OWNER, REPO_NAME ,PR_NUMBER} = MRInfo
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/requested_reviewers`, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });
    console.log('logs response.data', response.data)
    return response.data.users;
}

async function getReviewerLoad(reviewers: Reviewer[]) {
    const loadMap: Record<string, number> = {};
    for (let reviewer of reviewers) {
        // Здесь вы можете получить количество открытых PR для каждого ревьюера
        // Например, отправить запрос на получение всех открытых PR и
        // отфильтровать по автору.
        loadMap[reviewer.username] = reviewer.load;
    }
    return loadMap;
}

export async function assignReviewers(mr: string) {
    const mrInfo = getMRInfo(mr)
    if (!mrInfo) {
        // throw error
        return;
    }
    const {REPO_OWNER, REPO_NAME ,PR_NUMBER} = mrInfo
    // const pullRequest = await getPullRequest(mrInfo);
    const changedFiles = await getChangedFiles(mrInfo);
    const fileOwners = await getReviewersForFiles(changedFiles);
    const currentReviewers = await getCurrentReviewers(mrInfo);
    console.log('logs currentReviewers', currentReviewers, 'changedFiles', changedFiles, 'fileOwners', fileOwners)

    const reviewers: Reviewer[] = currentReviewers.map((user) => ({
        username: user.login,
        load: 0, // Здесь вам нужно будет получить фактическую нагрузку ревьюеров
    }));

    const reviewerLoad = await getReviewerLoad(reviewers);
    const selectedReviewers: string[] = [];

    // Логика для равномерного распределения нагрузки среди ревьюеров
    for (const file in fileOwners) {
        for (const owner of fileOwners[file]) {
            if (!selectedReviewers.includes(owner)) {
                selectedReviewers.push(owner);
                // Можно добавить логику для регулирования нагрузки
                break; // Обрабатываем первого подходящего ревьюера
            }
        }
    }

    // Вызов API для назначения ревьюеров
    await axios.post(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${PR_NUMBER}/requested_reviewers`, {
        reviewers: selectedReviewers,
    }, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
        },
    });
}

