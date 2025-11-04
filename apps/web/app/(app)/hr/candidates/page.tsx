export default function HRCandidatesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Candidates
          </h1>
          <p className="text-lg text-white/80">
            Review and evaluate candidate interview responses
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Candidates</h2>
          
          <div className="space-y-4">
            <div className="p-6 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl text-white font-semibold mb-1">John Doe</h3>
                  <p className="text-white/70">Frontend Developer Interview</p>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                  Completed
                </span>
              </div>
              <div className="flex gap-4 text-sm text-white/60 mb-4">
                <span>Score: 88%</span>
                <span>•</span>
                <span>Completed 2 days ago</span>
                <span>•</span>
                <span>45 min</span>
              </div>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors">
                View Results
              </button>
            </div>

            <div className="p-6 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl text-white font-semibold mb-1">Jane Smith</h3>
                  <p className="text-white/70">Backend Engineer Interview</p>
                </div>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
                  In Progress
                </span>
              </div>
              <div className="flex gap-4 text-sm text-white/60 mb-4">
                <span>3/5 questions</span>
                <span>•</span>
                <span>Started 1 hour ago</span>
              </div>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors">
                Monitor Progress
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
