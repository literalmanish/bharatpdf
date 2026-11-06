import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ToolGrid } from './components/ToolGrid';
import { ToolWorkspace } from './components/ToolWorkspace';
import { Footer } from './components/Footer';
import type { ToolDef } from './types';

export function App() {
  const [selectedTool, setSelectedTool] = useState<ToolDef | null>(null);

  const handleSelectTool = (tool: ToolDef) => {
    setSelectedTool(tool);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = () => {
    setSelectedTool(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-red-500 selection:text-white">
      <Navbar 
        onHomeClick={handleHomeClick} 
        activeToolName={selectedTool?.name} 
      />

      <main className="flex-1">
        {selectedTool ? (
          <ToolWorkspace 
            tool={selectedTool} 
            onBack={handleHomeClick} 
          />
        ) : (
          <>
            <Hero />
            <ToolGrid onSelectTool={handleSelectTool} />
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
