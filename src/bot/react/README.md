React Message
-------------
Реактивные сообщения

### Сообщение с кнопками

```tsx
import * as React from 'react';
import { Keyboard } from './bot/react/ui/Keyboard';
import { Text } from './bot/react/ui/Text';
import {useReactMessage} from "./bot/react/ui/Message";

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
```
```ts
const sendCounterMessage = async (chatId: string) => {
    await ReactMessage.describe('counter', Counter).send(
        chatId,
        {},
        {
            minApplyDelay: 1100,
        }
    );
};

await sendCounterMessage(mineAcc);
```
