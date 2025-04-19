import {MR} from "@/reviewers/getRequestedMRsForUser";
import axios from "axios";
import {GITHUB_TOKEN} from "@/reviewers/index";
import {PullRequestType} from "@/reviewers/getPullRequests";

type CommitAuthor = {
    login: string;          // The name of the author
};

type CommitDetails = {
    message: string;             // The commit message
    tree: { sha: string; url: string }; // Tree information
    url: string;                 // API URL to get the commit details
    author: CommitAuthor;        // Author information
    committer: CommitAuthor;     // Committer information (could be different from author)
    verification: {
        verified: boolean;        // Whether the commit is verified
        reason: string;          // Reason for verification status
        signature: string | null; // PGP signature (if applicable)
        payload: string | null;   // PGP payload (if applicable)
    };
};

// The main type for the commit response, which is an array of commits
type GitHubCommit = {
    sha: string;                // The SHA of the commit
    commit: CommitDetails;      // The details of the commit
    author: CommitAuthor;       // Author's information (if available)
    committer: CommitAuthor;    // Committer's information (if available)
    parents: Array<{ sha: string; url: string }> // Array of parent commits
};

export const getCommitsFromMR = async(mr: PullRequestType)=> {
    console.log('logs mr.url', mr.url)
    const commits = await axios.get(
        `${mr.url}/commits`,
        {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
            },
        }
    );
    return commits.data as GitHubCommit[]
}