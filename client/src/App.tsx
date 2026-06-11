import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PanelLeft } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import GeneralChatPage from "./pages/GeneralChatPage";
import "./index.css";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);

  return (
    <BrowserRouter>
      <div className={`app${sidebarOpen ? "" : " sidebar-closed"}`}>
        <Sidebar />
        {sidebarOpen && (
          <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
        )}
        <div className="main-wrapper">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <PanelLeft size={17} />
          </button>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat/general" element={<GeneralChatPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
