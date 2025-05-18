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

export const SomethingWentWrong = () => {
    return (
        <>
            <Text>Что-то пошло нет. Попробуйте обратиться похже</Text>
        </>
    );
};


export const NameInput = () => {
    return (
        <>
            <Text> Введите имя и фамилию </Text>
        </>
    );
};

export const GithubInput = () => {
    return (
        <>
            <Text> Введите, пожалуйста, github - аккаунт </Text>
        </>
    );
};

// todo: написать весь функционал который модет быть доступен
export const SuccessSubscribeUser = () => {
    return (
        <>
            <Text> Поздравляем 🎉, ты успешно добавился в бота! Теперь ты можешь пользоваться функционалом для работы с merge-request. 🚀💻 Все необходимые команды и возможности уже доступны, так что не стесняйся экспериментировать и интегрировать свою работу!🤖 </Text>
        </>
    );
};
