import * as React from 'react';
import {NewLine, Paragraph, Text} from '../react/ui/Text';
import {User} from "@/reviewers/getPullRequests";

export type MRType = {
    repoName: string
    repoHref: string
    mrNumber: number
    mrUrl: string
    mrName: string
    fileNumberChanged: number
    codeLinesAdded: number
    codeLinesRemoved: number
    approversCount: number
    author: User
}

export const PullRequestInfo = (props: { mr: MRType }) => {
    const {mr} = props;
    return (
        <>
            <Paragraph>
                🎰{' '}
                <Text link={mr.author?.html_url}>{mr.author.login }</Text>
                <Text bold={true}> → </Text>
                <Text link={mr.repoHref}>{mr.repoName}</Text>
                <Text bold={true}> → </Text>
                <Text link={mr.mrUrl}>{mr.mrNumber}</Text>
            </Paragraph>
            <Paragraph bold={true}>{mr.mrName}</Paragraph>
            <Paragraph bold={true}>{mr.fileNumberChanged} files
                <Text>({mr.codeLinesAdded ? `+${mr.codeLinesAdded}` : ''}
                    {mr.codeLinesAdded && mr.codeLinesRemoved ? `/` : ''}
                    {mr.codeLinesRemoved ? `-${mr.codeLinesRemoved}` : ''}
                    ) |
                    <Text bold={true}>{' '}👌 {mr.approversCount}/2</Text>
                </Text>
            </Paragraph>
            <NewLine/>
        </>
    );
};