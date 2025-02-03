```jsx
function WiseReinmder(props) {
	const [screen, setScreen] = useState('init');
	const [error, setError] = useState();

	useEffect(() => {
		if (screen !== 'add-project') {
			return;
		}

		return awaitTextInput(async (text) => {
			if (!isGitlabLink(text)) {
				setError('Увы, это не ссылка на Gitlab-проект');
				return;
			}
		});
	}, [screen]);

	return (
		<Message>
			<Title>⏰ Wise Reminder</Title>
			
			{error && <Paragraph italic>⚠️ {error}</Paragraph>}
			{screen === 'add-project' && <Paragraph>Оптавьте gitlab-ссылку на подключаемый проект</Paragraph>}

			<Keyboard>
				<Keyboard.Row>
					<Keyboard.Button onClick={() => setState('add-project')}>Подключить проект</Keyboard.Button>
				</Keyboard.Row>
				<Keyboard.Row><Keyboard.Button onClick={onAddProject}>Закрыть</Keyboard.Button></Keyboard.Row>
			</Keyboard>
		</Message>
	);
}
```