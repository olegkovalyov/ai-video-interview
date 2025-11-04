export default function HRInterviewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Interview Templates
          </h1>
          <p className="text-lg text-white/80">
            Create and manage AI-powered interview templates
          </p>
        </div>

        <div className="mb-6">
          <button className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors">
            + Create New Interview
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Your Interview Templates</h2>
          <div className="space-y-4">
            <div className="p-6 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl text-white font-semibold mb-1">Frontend Developer Interview</h3>
                  <p className="text-white/70">React, TypeScript, and modern frontend development</p>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                  Active
                </span>
              </div>
              <div className="flex gap-4 text-sm text-white/60 mb-4">
                <span>8 candidates</span>
                <span>•</span>
                <span>5 responses</span>
                <span>•</span>
                <span>45 min</span>
              </div>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors">
                Manage Template
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
