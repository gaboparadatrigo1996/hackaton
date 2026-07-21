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
    <div className="flex flex-col h-screen h-[100dvh] w-screen bg-darkBg text-textPri overflow-hidden select-none">
      {/* Global Header (Top Bar 1) */}
      <Header />

      {/* Project Header (Top Bar 2) */}
      <ProjectHeader />

      {/* Main Workspace Layout with Map taking full background */}
      <div className="relative flex-1 min-h-0 w-full overflow-hidden [isolation:isolate]">
        {/* Central interactive MapView taking 100% of workspace background */}
        <MapView
          isLoading={isLoading}
          isError={isError}
          error={error}
          refetch={refetch}
        />

        {/* Floating Glass Panels Layer: Left Sidebar & Right Detail Panel at z-20 */}
        <div className="absolute inset-0 z-20 flex flex-row justify-between h-full w-full pointer-events-none p-3 overflow-hidden [isolation:isolate] [transform:translateZ(0)]">
          {/* Left column: Floating translucent sidebar */}
          <div className="pointer-events-auto h-full [transform:translateZ(0)]">
            <Sidebar
              isLoading={isLoading}
              isError={isError}
              error={error}
              refetch={refetch}
            />
          </div>

          {/* Right column: Selected container detailed insights */}
          <div className="pointer-events-auto h-full [transform:translateZ(0)]">
            <ContainerDetailPanel isLoading={isLoading} />
          </div>
        </div>
      </div>

      {/* Floating Notifications stack */}
      <NotificationToast />
    </div>
  );
}

export default App;
