import {Keyboard} from "../react/ui/Keyboard";
import {Text} from "../react/ui/Text";
import * as React from "react";

export const UserNotFound = (props: {instructionToAdd: VoidFunction}) => {
    const instructionToAdd = () => {
        console.log('click me')
        props.instructionToAdd();
    }

    return (
        <>
            <Text> Мы вас не нашли в нашей базе данных. Хотите добавиться ?</Text>
            <Keyboard>
                <Keyboard.Button
                    id={'add me'}
                    value={'Добавиться'}
                    onClick={() => {
                        console.log('adding user')
                        instructionToAdd()
                    }}
                />
            </Keyboard>
        </>
    )
};
