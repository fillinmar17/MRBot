import * as React from 'react';
import {Text} from '../react/ui/Text';
import {Keyboard} from "@/bot/react/ui/Keyboard";
import {MRType, PullRequestInfo} from "@/bot/Components/PullRequestInfo";

export const AddedAsReviewer = (props: { mr: MRType }) => {
    const {mr} = props;
    return (
        <>
            <PullRequestInfo mr={mr}/>
            <Text>
                <Text link={mr.author.html_url}>{mr.author.login}</Text>
                {' '}выбрал(а) вас ревьювером 🙇‍♀️
            </Text>
            <Keyboard>
                <Keyboard.Row>
                    <Keyboard.Button
                        id={'open'}
                        value={'Открыть'}
                        url={mr.mrUrl}
                    />
                    <Keyboard.Button
                        id={'refuse'}
                        value={'Отказаться'}
                        onClick={() => {
                            // todo: do this
                            console.log('logs logic Отказаться')
                        }}
                    />
                </Keyboard.Row>
            </Keyboard>
        </>
    );
};