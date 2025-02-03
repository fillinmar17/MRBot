import * as React from 'react';
import {NewLine, Paragraph, Text} from '../react/ui/Text';
import {Keyboard} from "@/bot/react/ui/Keyboard";
import {MRType, PullRequestInfo} from "@/bot/Components/PullRequestInfo";


export const NewCommits = (props: { mr: MRType, name: string }) => {
    const {mr, name} = props;
    return (
        <>
            <PullRequestInfo mr={mr}/>
            <div>
                <Paragraph> 💡<Text bold={true}> Добавлен новый коммит</Text>
                    <Text>{name}</Text>
                </Paragraph>
            </div>
        </>
    );
};