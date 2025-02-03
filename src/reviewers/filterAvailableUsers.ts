interface VacationStatus {
    DateStart: string;  // Формат: "YYYY-MM-DD"
    DateEnd: string;
    VacationType: "ill" | "vacation" | "decree";
}

interface EmployeeInfo {
    Name: string;
    LastName: string;
    Email: string;
    Sysname: string;
    VacationStatusList: VacationStatus[];
    IsBlocked: boolean;
    JobStartDate: string;
    JobEndDate: string | null;
}

/**
 * Проверяет, доступен ли сотрудник сегодня и завтра
 */
const isEmployeeAvailable = (employee: EmployeeInfo): boolean => {
    if (employee.IsBlocked) return false;

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Проверяем, не находится ли сотрудник в отпуске/больничном
    return !employee.VacationStatusList.some(vacation => {
        const start = new Date(vacation.DateStart);
        const end = new Date(vacation.DateEnd);
        return (today >= start && today <= end) || (tomorrow >= start && tomorrow <= end);
    });
}
/**
 * Запрашивает информацию о сотруднике через внутреннее API
 */
const fetchEmployeeInfo = async (username: string): Promise<EmployeeInfo | null> => {
    const response = await fetch(`https://api/vk.team.intranet/v1/user/info?mail=${username}`);
    return await response.json();
}

/**
 * Фильтрует недоступных сотрудников
 */
export const filterAvailableUsers = async (usernames: string[]): Promise<string[]> => {
    const availableUsers: string[] = [];
    try {
        for (const username of usernames) {
            const info = await fetchEmployeeInfo(username);
            if (info && isEmployeeAvailable(info)) {
                availableUsers.push(username);
            }
        }
        return availableUsers;
    } catch (error) {
        console.log('[ERROR] in fetchEmployeeInfo', error)
        return usernames
    }
}