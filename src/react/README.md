React Message
-------------
Реактивыйне сообщения

---


```js
const counterMessage = describeReactMessage('demo/counter', (props) => {
	const {ui, store} = props;
	const [counter, setCounter] = store.useState(0);

	return (
		<ui.Message>
			<ui.Title>Counter: {counter}</ui.Title>
			<ui.Keyboard>
				<ui.Keyboard.Button onClick={() => setCounter(s => s - 1)} type="primary">
					-1
				</ui.Keyboard.Button>
				<ui.Keyboard.Button onClick={() => setCounter(s => s + 1)} type="atte">
					+1
				</ui.Keyboard.Button>
			</ui.Keyboard>
		</ui.Message>
	);
});

const message = await counterMessage(props);
```

### Приложение как сообщение

```jsx
import * as React from 'react';
import { InputText, Keyboard, Message, sendReactInteractiveMessage, sendReactStaticMessage, Title, useMessageContext } from '@mail-core/communicator/react';

const Welcome = () => {
	const [step, setStep] = React.useState('start');
	const [username, setUsername] = React.useState('');
	const {chat, bot} = useMessageContext();

	React.useEffect(() => {
		username && bot.sendMessage({
			to: chat,
			body: `Воу, вы посмотрите, его завут **${username}**!`,
			format: 'md2html',
		});
	}, [username]);

	if (step === 'name') {
		return (
			<Message>
				<InputText onInput={({body}) => {
					setUsername(body!);
					setStep('start')
				}}>
					Ну, и как там тебя звать?
				</InputText>
				<Keyboard>
					<Keyboard.Button onClick={() => setStep('start')}>Отмена</Keyboard.Button>
				</Keyboard>
			</Message>
		);
	}

	return (
		<Message>
			<Title>{username ? `Привет, ${username}!` : `Может представитесь?`}</Title>
			<Keyboard>
				<Keyboard.Button onClick={() => setStep('name')} type="primary">
					{username ? 'Сменить имя' : 'Представиться'}
				</Keyboard.Button>
			</Keyboard>
		</Message>
	);
};

sendReactInteractiveMessage(<Welcome/>);
```

---

### Приложение с несколькоми экранами

```jsx
const enum SettingsSection {
	Start,
	AddProject,
	ProjectList,
}

const Settings = () => {
	return (
		<Message.Group initId={SettingsSection.All} title="⏰ Wise Reminder">
			{/* Start Screen */}
			<Message id={SettingsSection.Start}>
				<Paragraph>Список проектов</Paragraph>
				<Nav>
					<Nav.Item id={SettingsSection.AddProject}>Подключить проект</Nav.Item>
					<Nav.Item id={SettingsSection.ProjectList}>Список проектов</Nav.Item>
				<Nav>
			</Message>
			
			{/* Add Project Screen */}
			<Message id={SettingsSection.AddProject}>
				<Paragraph>Оправьте ссылку на <b>gitlab</b>-проект</Paragraph>
				<Nav>
					<Nav.Item id={SettingsSection.Start}>Отмена</Nav.Item>
				<Nav>
			</Message>
			
			{/* Project List Screen */}
			<Message id={SettingsSection.AddProject}>
				<Paragraph>Список проектов</Paragraph>
				
				<DataGrid>
					{projects.map((project) => <DataGrid.Item
						value={project}
						controls={[
							<DataGrid.Ctrl value="✓" checked={true} />
							<DataGrid.Ctrl value="⤫" checked={false} />
						]}
					>)}
				</DataGrid>

				<Nav>
					<Nav.Item id={Nav.BACK_ID}>Назад</Nav.Item>
				<Nav>
			</Message>
		<Message.Group>
	);
};
```

---

### Статичное сообщение

```tsx
import * as React from 'react';
import {sendReactStaticMessage, Message, Title} from '@mail-core/communicator/react';

const Welcome = () => {
	return (
		<Message>
			<Title>Hi, I'm React Message!</Title>
		</Message>
	);
};

sendReactStaticMessage(<Welcome/>);
```
