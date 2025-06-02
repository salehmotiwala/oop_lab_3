import { EncryptDecrypt } from "./components/EncryptDecrypt/EncryptDecrypt";
import { Footer } from "./components/Footer";

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col font-geist">
      <div className="flex-1 w-full h-full">
        <EncryptDecrypt />
      </div>

      <Footer />
    </div>
  );
};

export default App;
