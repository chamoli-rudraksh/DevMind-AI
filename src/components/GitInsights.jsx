import React, { useState, useEffect } from "react";
import {
  GitBranch,
  GitCommit,
  Users,
  FileCode,
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
} from "lucide-react";

const ContributorBar = ({ name, commits, maxCommits }) => (
  <div className="flex items-center gap-3">
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-xs font-bold text-white shrink-0">
      {name.charAt(0).toUpperCase()}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-white truncate">{name}</span>
        <span className="text-xs text-[#94A3B8] ml-2">{commits} commits</span>
      </div>
      <div className="h-1.5 bg-[#0A0E27] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] transition-all duration-1000"
          style={{ width: `${(commits / maxCommits) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

const CommitFrequencyChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const maxCommits = Math.max(...data.map((d) => d.commits));

  return (
    <div className="space-y-2">
      {data.slice(-8).map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[10px] text-[#94A3B8] w-14 shrink-0">{item.month}</span>
          <div className="flex-1 h-2 bg-[#0A0E27] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#06B6D4] to-[#3B82F6] transition-all duration-700"
              style={{ width: `${(item.commits / maxCommits) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-[#94A3B8] w-6 text-right shrink-0">{item.commits}</span>
        </div>
      ))}
    </div>
  );
};

const GitInsights = ({ fullUrl }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsights = async () => {
    if (!fullUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:8000/api/git-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: fullUrl }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (e) {
      setError(e.message || "Failed to load git insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [fullUrl]);

  const maxContributorCommits = data?.contributors?.[0]?.commits || 1;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-[#2A3254] rounded-2xl border border-[#4A5578]/50 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/20 flex items-center justify-center">
              <GitBranch className="text-[#06B6D4]" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Git Insights</h2>
              <p className="text-sm text-[#94A3B8]">Repository history & contribution analysis</p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-2 rounded-lg bg-[#1A1F3A] border border-[#4A5578]/50 text-[#94A3B8] hover:text-white transition-colors disabled:opacity-40"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 size={36} className="animate-spin text-[#06B6D4]" />
            <p className="text-[#94A3B8] text-sm">Analyzing git history...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Commits", value: data.total_commits || "—", icon: GitCommit, color: "text-[#06B6D4]" },
                { label: "Contributors", value: data.contributors?.length || "—", icon: Users, color: "text-[#8B5CF6]" },
                { label: "Files Changed", value: data.most_changed_files?.length ? `${data.most_changed_files.length} tracked` : "—", icon: FileCode, color: "text-[#F59E0B]" },
                { label: "First Commit", value: data.first_commit ? new Date(data.first_commit).toLocaleDateString() : "—", icon: Calendar, color: "text-[#10B981]" },
              ].map((stat, i) => (
                <div key={i} className="bg-[#1A1F3A] rounded-xl p-4 border border-[#4A5578]/30">
                  <stat.icon size={18} className={`${stat.color} mb-2`} />
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-[#94A3B8]">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contributors */}
              {data.contributors?.length > 0 && (
                <div className="bg-[#1A1F3A] rounded-xl p-5 border border-[#4A5578]/30">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Users size={14} className="text-[#8B5CF6]" />
                    Top Contributors
                  </h3>
                  <div className="space-y-3">
                    {data.contributors.slice(0, 6).map((c, i) => (
                      <ContributorBar key={i} name={c.name} commits={c.commits} maxCommits={maxContributorCommits} />
                    ))}
                  </div>
                </div>
              )}

              {/* Commit Frequency */}
              {data.commit_frequency?.length > 0 && (
                <div className="bg-[#1A1F3A] rounded-xl p-5 border border-[#4A5578]/30">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#06B6D4]" />
                    Commit Activity
                  </h3>
                  <CommitFrequencyChart data={data.commit_frequency} />
                </div>
              )}
            </div>

            {/* Recent Commits */}
            {data.recent_commits?.length > 0 && (
              <div className="bg-[#1A1F3A] rounded-xl p-5 border border-[#4A5578]/30">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <GitCommit size={14} className="text-[#06B6D4]" />
                  Recent Commits
                </h3>
                <div className="space-y-2">
                  {data.recent_commits.slice(0, 8).map((commit, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#4A5578]/10 transition-colors">
                      <code className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded shrink-0 mt-0.5">
                        {commit.hash}
                      </code>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{commit.message}</p>
                        <p className="text-xs text-[#94A3B8]">
                          {commit.author} · {new Date(commit.date).toLocaleDateString()}
                          {commit.files_changed > 0 && ` · ${commit.files_changed} file${commit.files_changed > 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Most Changed Files */}
            {data.most_changed_files?.length > 0 && (
              <div className="bg-[#1A1F3A] rounded-xl p-5 border border-[#4A5578]/30">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <FileCode size={14} className="text-[#F59E0B]" />
                  Most Changed Files
                </h3>
                <div className="space-y-2">
                  {data.most_changed_files.slice(0, 8).map((f, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <code className="flex-1 text-xs font-mono text-[#E2E8F0] truncate">{f.file}</code>
                      <span className="text-xs text-[#94A3B8] shrink-0">{f.changes} changes</span>
                      <div className="w-16 h-1.5 bg-[#0A0E27] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#F59E0B]"
                          style={{ width: `${(f.changes / data.most_changed_files[0].changes) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.note && (
              <p className="text-xs text-[#4A5578] italic">{data.note}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GitInsights;
