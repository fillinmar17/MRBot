export enum ChatContext {
    START= 'start',
    INSTRUCTION ='instruction',
    ASK_NAME= 'ask_name',
    ASK_GITHUB='ask_github',
    END='end'
}

export type UserContext = {
    state: string;
    name: string;
    github?: string;
}

let contexts: Record<string, UserContext> = {};

export async function getOrCreateContext(chatId: string): Promise<UserContext> {
    if (!contexts[chatId]) {
        contexts[chatId] = {
            state: ChatContext.START,
            name: '',
            github: '',
        };
    }
    return contexts[chatId];
}