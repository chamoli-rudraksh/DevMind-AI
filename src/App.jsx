import React, { useState } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import LoadingScreen from "./components/LoadingScreen";
import Dashboard from "./components/Dashboard";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  const [status, setStatus] = useState("idle");
  const [progressStep, setProgressStep] = useState(0);
  const [repoName, setRepoName] = useState("");
  const [fullUrl, setFullUrl] = useState("");

  const handleAnalyze = (url) => {
    setFullUrl(url);
    const extractedName = url.includes("github.com")
      ? url.split("github.com/")[1] || url
      : url;
    setRepoName(extractedName);
    setStatus("complete");
    setProgressStep(2);
  };

  const handleReset = () => {
    setStatus("idle");
    setProgressStep(0);
    setRepoName("");
    setFullUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white selection:bg-[#3B82F6]/30">
      <Header
        status={status}
        progressStep={progressStep}
        repoName={repoName}
        onReset={handleReset}
      />

      {/* Ambient background blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#3B82F6]/8 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#06B6D4]/8 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-[#8B5CF6]/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative pt-16">
        <ErrorBoundary>
          {status === "idle" && <Hero onAnalyze={handleAnalyze} />}
          {status === "analyzing" && (
            <LoadingScreen onComplete={handleAnalysisComplete} repoName={repoName} />
          )}
          {status === "complete" && (
            <Dashboard
              repoName={repoName}
              fullUrl={fullUrl}
              onReset={handleReset}
            />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
