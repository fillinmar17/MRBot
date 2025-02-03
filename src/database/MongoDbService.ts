import { MongoClient, Db, ObjectId } from 'mongodb';
import {getBotType} from "@/bot/env";

export interface RepositoryDocument {
    _id?: ObjectId;
    url: string
    href: string // available for user browser
}

export interface PullRequestDocument {
    _id?: ObjectId;
    number?: number;
    reviewers?: string[];
    approvers?: string[];
    lastCommitSha?: string;
    lastCommentId?: number;
    updated_at?: Date;
    repositoryId: ObjectId
}

export interface UserDocument {
    telegram?: string,
    name: string, 
    github: string,
    vkteam?: string
}

export class MongoDbService {
    private client: MongoClient;
    private db: Db;
    private pullRequestsCollectionName = 'pullRequests'
    private usersCollectionName = 'users'

    constructor(connectionString: string, databaseName: string) {
        this.client = new MongoClient(connectionString);
        this.db = this.client.db(databaseName);
    }

    async connect(): Promise<void> {
        await this.client.connect();
        console.log('Connected successfully to server');
    }

    async closeConnection(): Promise<void> {
        await this.client.close();
    }

    async findUser(github: string): Promise<string | null> {
        try {
            const user =  await this.db.collection(this.usersCollectionName)
                .findOne({ github: github });
            if (user) {
                const botType = getBotType()
                console.log('logs user', user, 'botType', botType, user[botType])
                // todo: куегкт ьн ьуфтштп
                return user[botType]
            }
            return null;
        } catch (err) {
            throw new Error(`Failed to find user: ${err}`);
        }
    }

    async findUserBySocial(telegram?: string, vkteam?: string) {
        try {
            const query: any = {};
            if (telegram) {
                query.telegram = telegram;
            }
            if (vkteam) {
                query.vkteam = vkteam;
            }
            return this.db.collection(this.usersCollectionName)
                .findOne(query);
        } catch (err) {
            throw new Error(`Failed to find user by social: ${err}`);
        }
    }

    async addUser(data: UserDocument) {
        try {
            return this.db.collection(this.usersCollectionName)
                .insertOne(data);
        } catch (err) {
            throw new Error(`Failed to add user: ${err}`);
        }
    }

    async createRepository(repo: Omit<RepositoryDocument, '_id'>): Promise<ObjectId> {
        try {
            const result = await this.db.collection('repositories').insertOne({
                ...repo,
                createdAt: new Date(),
            });
            return result.insertedId;
        } catch (err) {
            throw new Error(`Failed to create repository: $message}`);
        }
    }

    async fetchRepositories() {
        try {
            return await this.db.collection('repositories').find().toArray();
        } catch (err) {
            throw new Error(`Failed to get repositories: ${err}`);
        }
    }

    async createPullRequest(pullRequest: Omit<PullRequestDocument, '_id'>) {
        try {
            return await this.db.collection(this.pullRequestsCollectionName).insertOne({
                ...pullRequest,
            });
        } catch (err) {
            throw new Error(`Failed to create pull request: ${err}`);
        }
    }

    async updatePullRequest(id: ObjectId, updates: Partial<Omit<PullRequestDocument, '_id'>>): Promise<void> {
        try {
            await this.db.collection(this.pullRequestsCollectionName).updateOne(
                { _id: id },
                { $set: updates }
            );
        } catch (err) {
            throw new Error(`Failed to update pull request: ${err}`);
        }
    }

    async fetchPullRequests(repositoryId: ObjectId) {
        try {
            console.log('logs pullRequestsFromDB: ',  await this.db.collection(this.pullRequestsCollectionName)
                .find({ })
                .toArray())
            return this.db.collection(this.pullRequestsCollectionName)
                .find({ repositoryId: repositoryId })
                .toArray();
        } catch (err) {
            throw new Error(`Failed to fetch pull requests: ${err}`);
        }
    }
}
