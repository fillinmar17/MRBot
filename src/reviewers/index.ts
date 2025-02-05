// import axios from 'axios';
//
// const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN';  // замените на свой токен
// const REPO_OWNER = 'owner';                  // замените на владельца репозитория
// const REPO_NAME = 'repository';              // замените на имя репозитория
//
// interface Reviewer {
//     username: string;
//     load: number;   // количество мерж-реквестов на ревью у данного ревьюера
// }
//
// async function getPullRequest(prNumber: number) {
//     const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}`, {
//         headers: {
//             Authorization: `token ${GITHUB_TOKEN}`,
//         },
//     });
//     return response.data;
// }
//
// async function getChangedFiles(prNumber: number) {
//     const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}/files`, {
//         headers: {
//             Authorization: `token ${GITHUB_TOKEN}`,
//         },
//     });
//     return response.data;
// }
//
// async function getReviewersForFiles(changedFiles: any[]) {
//     const fileOwners: Record<string, string[]> = {};
//     // Здесь вы можете использовать свою логику для определения владельцев файлов
//     // Например, читая файл CODEOWNERS или другое местоположение.
//
//     // Примерная логика:
//     for (let file of changedFiles) {
//         // Определите владельца файла (это требует настройки вашей логики)
//         const owners = /* ваша логика для нахождения владельцев файлов */;
//         fileOwners[file.filename] = owners;
//     }
//     return fileOwners;
// }
//
// async function getCurrentReviewers(prNumber: number) {
//     const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}/requested_reviewers`, {
//         headers: {
//             Authorization: `token ${GITHUB_TOKEN}`,
//         },
//     });
//     return response.data.users;
// }
//
// async function getReviewerLoad(reviewers: Reviewer[]) {
//     const loadMap: Record<string, number> = {};
//     for (let reviewer of reviewers) {
//         // Здесь вы можете получить количество открытых PR для каждого ревьюера
//         // Например, отправить запрос на получение всех открытых PR и
//         // отфильтровать по автору.
//         loadMap[reviewer.username] = reviewer.load;
//     }
//     return loadMap;
// }
//
// async function assignReviewers(prNumber: number) {
//     const pullRequest = await getPullRequest(prNumber);
//     const changedFiles = await getChangedFiles(prNumber);
//     const fileOwners = await getReviewersForFiles(changedFiles);
//     const currentReviewers = await getCurrentReviewers(prNumber);
//     console.log('logs currentReviewers', currentReviewers)
//
//     const reviewers: Reviewer[] = currentReviewers.map((user) => ({
//         username: user.login,
//         load: 0, // Здесь вам нужно будет получить фактическую нагрузку ревьюеров
//     }));
//
//     const reviewerLoad = await getReviewerLoad(reviewers);
//     const selectedReviewers: string[] = [];
//
//     // Логика для равномерного распределения нагрузки среди ревьюеров
//     for (const file in fileOwners) {
//         for (const owner of fileOwners[file]) {
//             if (!selectedReviewers.includes(owner)) {
//                 selectedReviewers.push(owner);
//                 // Можно добавить логику для регулирования нагрузки
//                 break; // Обрабатываем первого подходящего ревьюера
//             }
//         }
//     }
//
//     // Вызов API для назначения ревьюеров
//     await axios.post(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls/${prNumber}/requested_reviewers`, {
//         reviewers: selectedReviewers,
//     }, {
//         headers: {
//             Authorization: `token ${GITHUB_TOKEN}`,
//         },
//     });
// }
//
// // Вы можете вызывать assignReviewers, передавая номер PR
// assignReviewers(1).catch(console.error);