import { Routes, Route } from "react-router-dom";
import DataProductsPage from "./pages/DataProductsPage";
import MetricDefinitionsPage from "./pages/MetricDefinitionsPage";
import HomePage from "./pages/HomePage";
import DataStewardshipPage from "./pages/DataStewardshipPage";
import NavBar from "./components/navigation/NavBar";
import { DataWellnessCompanion } from "./components/wellness/DataWellnessCompanion";

// Temporary auth simulation - replace with proper auth later
const TEMP_USER = {
  username: "test_steward",
  displayName: "Test Steward",
};

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container mx-auto">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/data-products" element={<DataProductsPage />} />
          <Route path="/metric-definitions" element={<MetricDefinitionsPage />} />
          <Route path="/stewardship" element={<DataStewardshipPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {/* Chat companion with increased visibility */}
      <div className="fixed bottom-4 right-4 z-50">
        <DataWellnessCompanion />
      </div>
    </div>
  );
}

// fallback 404 not found page
function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-4 rounded-lg border p-6 bg-white shadow-sm">
        <div className="flex mb-4 gap-2">
          <svg className="h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900">404 Page Not Found</h1>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
    </div>
  );
}

export default App;