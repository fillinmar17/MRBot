import { MongoClient, Db, ObjectId } from 'mongodb';

interface RepositoryDocument {
    _id?: ObjectId;
    name: string;
    description: string;
    owner: {
        username: string;
        email: string;
    };
    createdAt: Date;
}

interface PullRequestDocument {
    _id?: ObjectId;
    repository_id: ObjectId;
    title: string;
    description: string;
    author: { username: string };
    state: 'open' | 'closed'; // Possible states
    created_at: Date;
    updated_at: Date;
    merged_at?: Date;
    characteristics: Array<{ key: string; value: any }>; // Characteristics as an array of objects
}

class MongoDbService {
    private client: MongoClient;
    private db: Db;

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
            throw new Error(`Failed to create repository: ${err.message}`);
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
            throw new Error(`Failed to update repository: ${err.message}`);
        }
    }

    /**
     * Create a new pull request tied to a given repository
     */
    async createPullRequest(pullRequest: Omit<PullRequestDocument, '_id' | 'updated_at'>): Promise<ObjectId> {
        try {
            const now = new Date();
            const result = await this.db.collection('pullRequests').insertOne({
                ...pullRequest,
                created_at: now,
                updated_at: now,
            });
            return result.insertedId;
        } catch (err) {
            throw new Error(`Failed to create pull request: ${err.message}`);
        }
    }

    /**
     * Update an existing pull request by id
     */
    async updatePullRequest(id: string, updates: Partial<Omit<PullRequestDocument, '_id'>>): Promise<void> {
        try {
            await this.db.collection('pullRequests').updateOne(
                { _id: new ObjectId(id) },
                { $set: updates }
            );
        } catch (err) {
            throw new Error(`Failed to update pull request: ${err.message}`);
        }
    }

    /**
     * Fetch all pull requests belonging to a certain repository
     */
    async fetchPullRequests(repositoryId: string): Promise<Array<PullRequestDocument>> {
        try {
            return this.db.collection('pullRequests')
                .find({ repository_id: new ObjectId(repositoryId) })
                .toArray();
        } catch (err) {
            throw new Error(`Failed to fetch pull requests: ${err.message}`);
        }
    }
}

(async () => {
    try {
        const mongoService = new MongoDbService('mongodb://localhost:27017', 'gitHubClone');
        await mongoService.connect();

        // Example usage:
        // Creating a new repository
        const newRepoId = await mongoService.createRepository({
            name: 'My Awesome Repo',
            description: 'A simple test repository.',
            owner: { username: 'johndoe', email: 'john@example.com' },
        });
        console.log(`New repository created with ID ${newRepoId}`);

        // Updating the newly created repository
        await mongoService.updateRepository(newRepoId.toHexString(), {
            description: 'Updated description!',
        });
        console.log(`Repository updated!`);

        // Adding a new pull request
        const prId = await mongoService.createPullRequest({
            repository_id: newRepoId,
            title: 'Add initial feature',
            description: 'Adding first set of functionalities.',
            author: { username: 'alice' },
            state: 'open',
            characteristics: [{ key: 'type', value: 'enhancement' }],
        });
        console.log(`Created pull request with ID ${prId}`);

        // Listing all pull requests for the repository
        const pullRequests = await mongoService.fetchPullRequests(newRepoId.toHexString());
        console.log('Pull Requests:', pullRequests.map((pr) => pr.title));

        await mongoService.closeConnection();
    } catch (err) {
        console.error(err);
    }
})();