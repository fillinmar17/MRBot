import axios from "axios";
import {GITHUB_TOKEN} from "@/reviewers/index";

type RepositoryApprovedStatusFromGraphQL = {
    reviews: {
        nodes: {
            state: "COMMENTED" | "APPROVED"
            author: {
                login: string
            }
        }[]
    }
}
export type ApprovingState = {
    login: string
    state: "COMMENTED" | "APPROVED" | "WAITING"
}

export const getMRApprovedStatus = async (pullRequestNumber: number, owner: string, name: string) => {
    const graphqlQuery = {
        query: `
        {
          repository(name: "${name}", owner: "${owner}") {
            pullRequest(number: ${pullRequestNumber}) {
              reviews(first: 100) {
                nodes {
                  state
                  author {
                    login
                  }
                }
              }
            }
          }
        }
      `
    };
    try {
        const response = await axios.post('https://api.github.com/graphql', graphqlQuery, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('response', response.data);
        const repositoryApprovedStatus = response.data.data.repository.pullRequest as RepositoryApprovedStatusFromGraphQL
        return repositoryApprovedStatus.reviews.nodes
            .reduce((acc: string[], node) => {
                if (node.state === 'APPROVED') {
                    acc.push(node.author.login);
                }
                return acc;
            }, []) as string[]
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.log('[Error] in getMRApprovedStatus isAxiosError error.code:', error.code, 'error.message: ', error.message)
        }
        console.log('[Error] in getMRApprovedStatus', error)
        return [] as string[]
    }
}