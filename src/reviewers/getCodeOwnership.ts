import {GITHUB_TOKEN, MRFilesTypes, MRInfoType} from "./index";
import axios from "axios";
import * as yaml from 'js-yaml';

const CodeOwnershipFile = 'CODEOWNERS.yaml'

export type CodeOwner = {
    name: string;
    email: string;
    telegramId: string;
};

type CodeOwnershipFileType = {
    codeOwnership: CodeOwnershipEntry[]
}
type CodeOwnershipEntry = {
    paths: string[];
    owners: CodeOwner[];
};

export const getCodeOwnershipInfo = async(mrInfo: MRInfoType):Promise<CodeOwnershipFileType | undefined> => {
    const {REPO_OWNER, REPO_NAME} = mrInfo
        const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CodeOwnershipFile}?ref=main`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3.raw',
                    'Authorization': `token ${GITHUB_TOKEN}` // Use a token if needed
                }
            });

            if (response.data) {
                const codeOwnershipEntries = yaml.load(response.data) as CodeOwnershipFileType;
                console.log('logs in getCodeOwnershipInfo codeOwnershipEntries', codeOwnershipEntries)
                return codeOwnershipEntries;
            } else {
                console.error('No content found in the response.');
            }
        } catch (error) {
            console.error('Error fetching the YAML file:', error);
        }
        return ;
}

export const getCodeOwnership = async(changedFiles: MRFilesTypes[],codeOwnershipEntries:  CodeOwnershipFileType | undefined): Promise<CodeOwner[] | undefined>   => {
    if (!codeOwnershipEntries || !codeOwnershipEntries.codeOwnership) {
        return
    }

    const {codeOwnership} = codeOwnershipEntries
    let codeOwners: CodeOwner[] = [];
    console.log('logs changedFiles', changedFiles.map((file)=>file.filename), 'codeOwnership', codeOwnership)
    changedFiles.forEach(file => {
        for (let i = 0; i < codeOwnership.length; i++){
            const entry = codeOwnership[i];
            const isPathMatched = entry.paths.some(path => {
                if (path === '*' ) {
                    return true
                }
                const regex = new RegExp(`^${path.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')}$`);
                return regex.test(file.filename);
            });

            console.log('logs isPathMatched', isPathMatched,'entry.owners', entry.owners,'entry.paths', entry.paths, 'file.filename', file.filename)
            if (isPathMatched) {
                codeOwners = entry.owners ;
            }
        }
        return
    })
    return codeOwners;
}