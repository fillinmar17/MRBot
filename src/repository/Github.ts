import {Config} from "../config/Config";
import axios from "axios";

interface DefaultHeaders {
  Accept: string
}

interface PullRequestAuthor {
  avatar: string,
  username: string
}

export interface PullRequest {
  title: string,
  id: string,
  url: string,
  author: PullRequestAuthor,
  createdAt: Date
}

export class Github {
  private apiVersion = "application/vnd.github.v3+json";
  private config: Config;
  private readonly defaultHeaders: DefaultHeaders;

  constructor() {
    this.config = new Config();
    this.defaultHeaders = {
      Accept: this.apiVersion
    }
  }

  async getUsername(token: string): Promise<string|null> {
    const url = `https://api.github.com/user`
    const headers = Object.assign(this.defaultHeaders, {
      Authorization: `token ${token}`
    });

    const response = await axios.get(url, {headers});
    if(response.status === 200 && response.data) {
      return response.data.login
    }

    return null;
  }

  async getPullRequestsWaitingForReview(repository: string, username: string, token: string): Promise<PullRequest[]> {
    const url = `https://api.github.com/repos/${repository}/pulls`
    const headers = Object.assign(this.defaultHeaders, {
      Authorization: `token ${token}`
    });

    const response = await axios.get(url, {headers});
    const pullRequestsWaitingForReview = [];
    if(response.status === 200) {
      response.data.map(pullrequest => {
        const reviewers = pullrequest.requested_reviewers;
        reviewers.map(reviewer => {
          if(reviewer.login === username) {
            pullRequestsWaitingForReview.push({
              title: pullrequest.title,
              url: pullrequest.html_url,
              id: pullrequest.id,
              createdAt: new Date(pullrequest.created_at),
              author: {
                avatar: pullrequest.user.avatar_url,
                username: pullrequest.user.login
              }
            })
          }
        })
      })
      return pullRequestsWaitingForReview;
    }
    throw new Error(`An error occurred when trying to fetch a pull request from ${repository}`);
  }
}
