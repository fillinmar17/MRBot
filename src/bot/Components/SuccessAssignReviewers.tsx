import * as React from 'react';
import {Paragraph, Text} from '../react/ui/Text';

export type SuccessAssignReviewersType = {
    repoName: string
    repoHref?: string
    mrNumber: number
    mrUrl: string
    reviewers: string[]
}

export const SuccessAssignReviewers = (props: SuccessAssignReviewersType) => {
    const {reviewers} = props;
    const usersCount = reviewers.length
    const UserList = reviewers.map((user, index) => {
        return <Text italic={true}>{`${user}${index < usersCount -1 ? ', ' : ''}`}</Text>
    })
    return (
        <>
            <Paragraph>
                <Text bold={true}>🤖Назначили ревьюеров на {' '}</Text>
                <Text link={props.repoHref}>{props.repoName}</Text>
                <Text bold={true}> →
                <Text link={props.mrUrl}>{' '}{props.mrNumber}</Text>
                </Text>
            </Paragraph>
            <Paragraph>
                {'      '}{UserList}
            </Paragraph>
        </>
    );
};