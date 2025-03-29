import * as React from 'react';
import { Text } from '../react/ui/Text';

export const MRNotFound = (props: {link: string}) => {
    const {link} = props;
    return (
        <>
            <Text>По ссылке </Text>
            <Text italic={true}>  {link} </Text>
            <Text> мердж-реквест не найден </Text>
        </>
    );
};