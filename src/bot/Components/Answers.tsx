import * as React from 'react';
import {NewLine, Paragraph, Text} from '../react/ui/Text';
import {Keyboard} from "@/bot/react/ui/Keyboard";
import {MRType, PullRequestInfo} from "@/bot/Components/PullRequestInfo";

export type AnswerType = {
    text?: string
    isApprove?: boolean
    link: string
}

export const Answers = (props: { mr: MRType, answers: Record<string, AnswerType[]> }) => {
    const {mr, answers} = props;
    return (
        <>
            <PullRequestInfo mr={mr}/>
            {Object.keys(answers).map((author) => {
                    return (
                        <div>
                            <Paragraph> 💡<Text bold={true}> Ответы </Text> от 🦸<Text>{author}</Text></Paragraph>
                            {answers[author].map((answer) => {
                                    if (answer.isApprove !== undefined) {
                                        return (
                                            <Paragraph> • 👊
                                                <Text link={answer.link}>{' '}Апрув получен</Text>
                                            </Paragraph>
                                        )
                                    }
                                    if (answer.text) {
                                        return (
                                            <Paragraph> • ☀️
                                                <Text link={answer.link}>{' '}answer.text</Text>
                                            </Paragraph>
                                        )
                                    }
                                    return null
                                }
                            )}
                            <NewLine />
                        </div>
                    )
                }
            )}
        </>
    );
};