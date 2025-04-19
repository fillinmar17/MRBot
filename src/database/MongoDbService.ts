import { MongoClient, Db, ObjectId } from 'mongodb';

interface RepositoryDocument {
    _id?: ObjectId;
    url: string
}

interface PullRequestDocument {
    _id?: ObjectId;
    number?: number;
    reviewers?: string[];
    approvers?: string[];
    lastCommitSha?: string;
    lastCommentId?: number;
    updated_at?: Date;
    repositoryId: ObjectId
}

export class MongoDbService {
    private client: MongoClient;
    private db: Db;
    private pullRequestsCollectionName = 'pullRequests'

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

    /**
     * Create a new repository entry
     */
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

    /**
     * Update an existing repository by id
     */
    async updateRepository(id: string, updates: Partial<Omit<RepositoryDocument, '_id'>>): Promise<void> {
        try {
            await this.db.collection('repositories').updateOne(
                { _id: new ObjectId(id) },
                { $set: updates }
            );
        } catch (err) {
            throw new Error(`Failed to update repository: ${err}`);
        }
    }

    /**
     * Create a new pull request tied to a given repository
     */
    async createPullRequest(pullRequest: Omit<PullRequestDocument, '_id'>) {
        try {
            return await this.db.collection(this.pullRequestsCollectionName).insertOne({
                ...pullRequest,
            });
        } catch (err) {
            throw new Error(`Failed to create pull request: ${err}`);
        }
    }

    /**
     * Update an existing pull request by id
     */
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

    /**
     * Fetch all pull requests belonging to a certain repository
     */
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

// (async () => {
//     try {
//         const mongoService = new MongoDbService('mongodb://localhost:27017', 'gitHubClone');
//         await mongoService.connect();
//
//         // Example usage:
//         // Creating a new repository
//         const newRepoId = await mongoService.createRepository({
//             name: 'My Awesome Repo',
//             description: 'A simple test repository.',
//             owner: { username: 'johndoe', email: 'john@example.com' },
//         });
//         console.log(`New repository created with ID ${newRepoId}`);
//
//         // Updating the newly created repository
//         await mongoService.updateRepository(newRepoId.toHexString(), {
//             description: 'Updated description!',
//         });
//         console.log(`Repository updated!`);
//
//         // Adding a new pull request
//         const prId = await mongoService.createPullRequest({
//             repository_id: newRepoId,
//             title: 'Add initial feature',
//             description: 'Adding first set of functionalities.',
//             author: { username: 'alice' },
//             state: 'open',
//             characteristics: [{ key: 'type', value: 'enhancement' }],
//         });
//         console.log(`Created pull request with ID ${prId}`);
//
//         // Listing all pull requests for the repository
//         const pullRequests = await mongoService.fetchPullRequests(newRepoId.toHexString());
//         console.log('Pull Requests:', pullRequests.map((pr) => pr.title));
//
//         await mongoService.closeConnection();
//     } catch (err) {
//         console.error(err);
//     }
// })();