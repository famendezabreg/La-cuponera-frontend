import { create } from 'zustand';

const applyTheme = (dark) => {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('darkMode', dark ? '1' : '0');
};

const savedDark = localStorage.getItem('darkMode') === '1';
applyTheme(savedDark);

const useThemeStore = create((set) => ({
  isDark: savedDark,
  toggleDark: () =>
    set((state) => {
      const next = !state.isDark;
      applyTheme(next);
      return { isDark: next };
    }),
}));

export default useThemeStore;
