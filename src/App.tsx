import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import InventoryPage from "@/pages/InventoryPage";
import PolishingPage from "@/pages/PolishingPage";
import MarketPage from "@/pages/MarketPage";
import ShopPage from "@/pages/ShopPage";
import QuestsPage from "@/pages/QuestsPage";
import ToolCraftPage from "@/pages/ToolCraftPage";
import CollectionPage from "@/pages/CollectionPage";
import ResourceHUD from "@/components/ResourceHUD";
import BottomTabBar from "@/components/BottomTabBar";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import { useState, useEffect, useCallback } from "react";
import { AuthContext } from '@/contexts/authContext';
import { ThemeProvider } from '@/contexts/themeContext';
import { UserDataContext } from '@/contexts/userDataContext';
import { UserData } from '@/types';
import { mockUserData } from '@/data/demoUser';
import { Preferences } from '@capacitor/preferences';

const USER_DATA_KEY = 'magic-stone-mobile-data';

async function loadUserData(): Promise<UserData> {
  try {
    const result = await Preferences.get({ key: USER_DATA_KEY });
    if (result.value) {
      const parsed = JSON.parse(result.value);
      return { ...mockUserData, ...parsed };
    }
  } catch {
    console.warn('Failed to load saved data, using defaults.');
  }
  return mockUserData;
}

async function saveUserData(data: UserData): Promise<void> {
  try {
    await Preferences.set({ key: USER_DATA_KEY, value: JSON.stringify(data) });
  } catch {
    console.warn('Failed to save user data.');
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [userData, setUserData] = useState<UserData>(mockUserData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData().then(data => {
        setUserData(data);
        setLoading(false);
      });
    }
  }, [isAuthenticated]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const updateUserData = useCallback((newData: Partial<UserData>) => {
    setUserData((prev: UserData) => {
      const next = { ...prev, ...newData };

      // Auto-record newly discovered ore types into permanent collection
      if (newData.stones) {
        const discovered = { ...(next.discoveredOres || prev.discoveredOres || {}) };
        for (const s of newData.stones) {
          const key = `${s.grade}-${s.subGrade}`;
          if (!discovered[key]) {
            discovered[key] = s.acquiredAt ?? Date.now();
          }
        }
        next.discoveredOres = discovered;
      }

      saveUserData(next);
      return next;
    });
  }, []);

  if (!isAuthenticated) {
    return <LoginPage setIsAuthenticated={setIsAuthenticated} />;
  }

  if (loading) {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-gem text-5xl text-purple-400 animate-pulse mb-4 block" />
          <p className="text-gray-500 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <AuthContext.Provider
        value={{ isAuthenticated, setIsAuthenticated, logout }}
      >
        <UserDataContext.Provider value={{ userData, updateUserData }}>
          <div className="h-dvh bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 text-gray-900 flex flex-col relative overflow-hidden">
            {/* Static background decorations */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
              <div className="absolute top-[5%] left-[5%] w-32 h-32 bg-purple-300 rounded-full opacity-[0.06] blur-2xl" />
              <div className="absolute top-[20%] right-[8%] w-40 h-40 bg-blue-300 rounded-full opacity-[0.05] blur-2xl" />
              <div className="absolute bottom-[20%] left-[10%] w-36 h-36 bg-indigo-300 rounded-full opacity-[0.06] blur-2xl" />
              <div className="absolute bottom-[30%] right-[5%] w-28 h-28 bg-pink-300 rounded-full opacity-[0.05] blur-2xl" />
            </div>

            <ResourceHUD />

            <main className="flex-1 overflow-y-auto overflow-x-hidden pb-16">
              <div className="px-3 pt-3 pb-2">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/polishing" element={<PolishingPage />} />
                  <Route path="/market" element={<MarketPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/quests" element={<QuestsPage />} />
                  <Route path="/toolcraft" element={<ToolCraftPage />} />
                  <Route path="/collection" element={<CollectionPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </div>
            </main>

            <BottomTabBar />
          </div>
        </UserDataContext.Provider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
