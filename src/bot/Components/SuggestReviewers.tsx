import * as React from 'react';
import {NewLine, Paragraph, Text} from '../react/ui/Text';
import {User} from "@/reviewers/getPullRequests";
import {Keyboard} from "@/bot/react/ui/Keyboard";

export type SuggestReviewersType = {
    repoName: string
    repoHref?: string
    mrNumber: number
    mrUrl: string
    suggesters: string[]
    setReviewers: VoidFunction
}

export const SuggestReviewers = (props: SuggestReviewersType) => {
    return (
        <>
            <Paragraph>
                <Text bold={true}>🤖Подобрали для вас ревьеров для{' '}</Text>
                <Text link={props.repoHref}>{props.repoName}</Text>
                <Text bold={true}> →
                <Text link={props.mrUrl}>{' '}{props.mrNumber}</Text>
                </Text>
            </Paragraph>
            {props.suggesters.map((suggester) => {
                return (
                    <Paragraph key={suggester}>
                        {'        '}• {suggester}
                    </Paragraph>
                )
            })}
            <NewLine/>
            <Keyboard>
                <Keyboard.Row>
                    <Keyboard.Button
                        id={'set'}
                        value={'Назначить'}
                        onClick={props.setReviewers}
                    />
                    <Keyboard.Button
                        id={'refuse'}
                        value={'🎰 Подобрать других'}
                        onClick={() => {
                            // todo: do this
                            console.log('logs 🎰 Подобрать других')
                        }}
                    />
                </Keyboard.Row>
            </Keyboard>
        </>
    );
};