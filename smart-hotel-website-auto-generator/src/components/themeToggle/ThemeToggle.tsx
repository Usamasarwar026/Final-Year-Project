import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-7 rounded-full bg-secondary border border-border transition-colors flex items-center px-1 cursor-pointer"
      aria-label="Toggle theme"
    >
      <span
        className={`absolute w-5 h-5 rounded-full bg-gradient-brand flex items-center justify-center transition-transform duration-300 ${
          theme === "dark" ? "translate-x-0" : "translate-x-7"
        }`}
      >
        {theme === "dark" ? (
          <Moon className="w-3 h-3 text-primary-foreground" />
        ) : (
          <Sun className="w-3 h-3 text-primary-foreground" />
        )}
      </span>
    </button>
  );
};

export default ThemeToggle;
