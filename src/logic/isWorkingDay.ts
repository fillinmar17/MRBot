import axios from "axios";

export const isWorkingDay = async (date: Date): Promise<boolean> => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}${month}${day}`;

    try {
        const response = await axios.get(`https://isdayoff.ru/api/getdata?date=${formattedDate}`);
        // 0 - working day, 1 - weekend/holiday
        return response.data === 0;
    } catch (error) {
        console.error('[Error] checking working day:', error);
        return false;
    }
};