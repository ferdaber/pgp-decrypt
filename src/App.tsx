import { DecryptPane } from './components/DecryptPane';
import { EncryptPane } from './components/EncryptPane';
import { ToastHost } from './components/Toast';
import { ToastProvider } from './useToast';

export function App() {
  return (
    <ToastProvider>
      <div className="app">
        <DecryptPane />
        <EncryptPane />
      </div>
      <ToastHost />
    </ToastProvider>
  );
}
