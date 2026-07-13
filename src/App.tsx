import { Header } from "./components/Header";
import { ProjectHeader } from "./components/ProjectHeader";
import { Sidebar } from "./components/Sidebar";
import { MapView } from "./components/MapView";
import { ContainerDetailPanel } from "./components/ContainerDetailPanel";
import { NotificationToast } from "./components/NotificationToast";
import { useContainerSensors } from "./hooks/useContainerSensors";

function App() {
  // Activate the IoT sensor simulation WebSocket connection
  useContainerSensors();

  return (
    <div className="flex flex-col h-screen w-screen bg-darkBg text-textPri overflow-hidden select-none">
      {/* Global Header (Top Bar 1) */}
      <Header />

      {/* Project Header (Top Bar 2) */}
      <ProjectHeader />

      {/* Main Workspace Layout */}
      <div className="flex flex-row flex-1 min-h-0 w-full overflow-hidden">
        {/* Left column: Sidebar dashboard metrics and list */}
        <Sidebar />

        {/* Central interactive MapView */}
        <MapView />

        {/* Right column: Selected container detailed insights */}
        <ContainerDetailPanel />
      </div>

      {/* Floating Notifications stack */}
      <NotificationToast />
    </div>
  );
}

export default App;
