import * as React from 'react';

export class ErrorBoundary extends React.Component<{children?: React.ReactNode}, {hasError: boolean}> {
	state = {hasError: false};

	static getDerivedStateFromError(error: unknown) {
		console.log('getDerivedStateFromError:', {error});
		return {hasError: true};
	}

	componentDidCatch(error: unknown, errorInfo: unknown) {
		console.log('componentDidCatch:', {error, errorInfo});
	}

	render() {
		return this.props.children;
	}
}
