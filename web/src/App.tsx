import { useState } from "react";
import { InterviewSetup } from "./components/InterviewSetup";
import { InterviewSession } from "./components/InterviewSession";
import type { InterviewConfig } from "./components/InterviewSetup";

export default function App() {
  const [config, setConfig] = useState<InterviewConfig | null>(null);

  if (config) {
    return <InterviewSession config={config} onExit={() => setConfig(null)} />;
  }

  return <InterviewSetup onStart={setConfig} />;
}
