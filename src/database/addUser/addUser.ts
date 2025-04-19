import {ReactMessage} from "@/bot/react/core/message/message";
import {UserNotFound} from "@/bot/Components/UserNotFound";
import {GithubInput, NameInput, SuccessSubscribeUser} from "@/bot/Components/Errors";
import {Collection, MongoServerError} from "mongodb";
import {ChatContext, getOrCreateContext} from "@/database/addUser/helpers";

export const addUser = async(chatId: string, text: string, collection: Collection<Document>) => {
    const ctx = await getOrCreateContext(chatId);
    switch (ctx.state) {
        case ChatContext.START:
            const instructionToAdd = async () => {
                ctx.state = ChatContext.INSTRUCTION;
            }
            await ReactMessage.describe('userNotFound', UserNotFound).send(
                chatId,
                {instructionToAdd},
            );
            break
        case ChatContext.INSTRUCTION:
            await ReactMessage.describe('nameInput', NameInput).send(
                chatId,
                {},
            );
            ctx.state = ChatContext.ASK_NAME;
            break
        case ChatContext.ASK_NAME:
            ctx.name = text.trim()
            await ReactMessage.describe('githubInput', GithubInput).send(
                chatId,
                {},
            );
            ctx.state = ChatContext.ASK_GITHUB;
            break
        case ChatContext.ASK_GITHUB:
            ctx.github = text.trim();
            try {
                await collection!.insertOne({ telegram: chatId, name: ctx.name, github: ctx.github });
            } catch (error) {
                if (error instanceof MongoServerError) {
                    console.log(`MongoServerError during insertOne: ${error}`);
                }
                ctx.state = ChatContext.START;
                await ReactMessage.describe('successSubscribeUser', SuccessSubscribeUser).send(
                    chatId,
                    {},
                );
            }
            ctx.state = ChatContext.END;
            await ReactMessage.describe('successSubscribeUser', SuccessSubscribeUser).send(
                chatId,
                {},
            );
    }
}