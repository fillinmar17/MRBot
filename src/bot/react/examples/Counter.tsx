import * as React from 'react';
import { Keyboard } from '../ui/Keyboard';
import { Text } from '../ui/Text';
import {useReactMessage} from "../ui/Message";

export const Counter = () => {
    const { useValue } = useReactMessage();
    const [counter, setCounter] = useValue(0);

    const keyboardComponent = (
        <Keyboard>
            <Keyboard.Button
                id={'increment'}
                value={`Increment (${counter})`}
                onClick={() => {
                    console.log('logs setCounter')
                    setCounter(prev => prev + 1)
                }}
            />
            <Keyboard.Button
                id={'dencrement'}
                value={`Decrement (${counter})`}
                onClick={() => {
                    console.log('logs dencrement setCounter')
                    setCounter(prev => prev - 1)
                }}
            />
        </Keyboard>
    );

    return (
        <>
            <Text>Counter value: {counter}</Text>
            {keyboardComponent}
        </>
    );
};