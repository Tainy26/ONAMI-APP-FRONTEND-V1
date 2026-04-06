import { AuthProvider } from "./context/AuthContext";
import { AppRouter } from "./routes/Router";

export default function App() {
  return (
    <AuthProvider>
      <AppRouter/>
    </AuthProvider>
  );
}