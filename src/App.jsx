export default App;

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
    setStatus("analyzing");
    setProgressStep(1);
  };

  const handleAnalysisComplete = () => {
    setStatus("complete");
    setProgressStep(2);
  };

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white selection:bg-[#3B82F6]/30">
      <Header status={status} progressStep={progressStep} />

      <main className="relative pt-16">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#3B82F6]/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#06B6D4]/10 rounded-full blur-[120px]" />
        </div>

        {status === "idle" && <Hero onAnalyze={handleAnalyze} />}
        {status === "analyzing" && (
          <LoadingScreen onComplete={handleAnalysisComplete} />
        )}

        {}
        {status === "complete" && (
          <Dashboard repoName={repoName} fullUrl={fullUrl} />
        )}
      </main>
    </div>
  );
}
