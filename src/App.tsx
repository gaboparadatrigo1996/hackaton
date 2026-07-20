import { Header } from "./components/Header";
import { ProjectHeader } from "./components/ProjectHeader";
import { Sidebar } from "./components/Sidebar";
import { MapView } from "./components/MapView";
import { ContainerDetailPanel } from "./components/ContainerDetailPanel";
import { NotificationToast } from "./components/NotificationToast";
import { useRealtimeSensors } from "./hooks/useRealtimeSensors";

function App() {
  // Sincronización en tiempo real con el backend Azure de sensores
  const { isLoading, isError, error, refetch } = useRealtimeSensors();

  return (
    <div className="flex flex-col h-screen w-screen bg-darkBg text-textPri overflow-hidden select-none">
      {/* Global Header (Top Bar 1) */}
      <Header />

      {/* Project Header (Top Bar 2) */}
      <ProjectHeader />

      {/* Main Workspace Layout */}
      <div className="flex flex-row flex-1 min-h-0 w-full overflow-hidden">
        {/* Left column: Sidebar dashboard metrics and list */}
        <Sidebar
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
        />

        {/* Central interactive MapView */}
        <MapView
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
        />

        {/* Right column: Selected container detailed insights */}
        <ContainerDetailPanel isLoading={isLoading} />
      </div>

      {/* Floating Notifications stack */}
      <NotificationToast />
    </div>
  );
}

export default App;
