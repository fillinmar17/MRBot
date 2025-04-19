import * as React from 'react';
import {Text} from '../react/ui/Text';

export const SuccessAssignReviewers = (props: { users: string[] }) => {
    const {users} = props;
    const usersCount = users.length
    const UserList = users.map((user, index) => {
        return <Text italic={true}>{`${user}${index < usersCount -1 ? ', ' : ''}`}</Text>
    })
    return (
        <>
            <Text> На мердж-реквест назначены </Text>
            {UserList}
        </>
    );
};