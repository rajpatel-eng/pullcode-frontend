import './App.css'
import AppRoutes from "./routes/AppRoutes";
import { SnackbarProvider } from './components/common/Snackbar';

function App() {
  return (
    <SnackbarProvider>
      <AppRoutes />
    </SnackbarProvider>
  );
}

export default App
