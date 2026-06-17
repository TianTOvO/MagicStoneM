import { createContext } from 'react';
import { UserData } from '@/types';

interface UserDataContextType {
  userData: UserData;
  updateUserData: (newData: Partial<UserData> | ((prev: UserData) => Partial<UserData>)) => void;
}

export const UserDataContext = createContext<UserDataContextType>({
  userData: {
    stones: [],
    tools: [],
    coins: 0,
    quests: [],
    discoveredOres: {},
    lastDailyReset: 0,
    mineLevel: 1,
    mineLastCollect: 0,
    workbenchLevel: 1,
    workbenchBuffer: [],
    autoPolishLastTime: 0,
    autoPolishMinGrade: 0,
    autoPolishMaxGrade: 0,
    workbenchBoundToolId: null,
  },
  updateUserData: () => {},
});
