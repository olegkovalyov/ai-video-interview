export default function CandidateInterviewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            My Interviews
          </h1>
          <p className="text-lg text-white/80">
            Your interview invitations and completed assessments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pending Interviews */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></span>
              Pending Interviews
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                <h3 className="text-white font-semibold mb-2">Frontend Developer Interview</h3>
                <p className="text-white/70 text-sm mb-3">React, TypeScript, UI/UX</p>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Invited 2 days ago</span>
                  <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors text-sm">
                    Start Now
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                <h3 className="text-white font-semibold mb-2">Product Manager Assessment</h3>
                <p className="text-white/70 text-sm mb-3">Strategy, roadmapping</p>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">Invited 5 days ago</span>
                  <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors text-sm">
                    Start Now
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Completed Interviews */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              Completed Interviews
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Senior Backend Engineer</h3>
                <p className="text-white/70 text-sm mb-3">Node.js, microservices</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-green-400 font-semibold">Score: 88%</span>
                    <span className="text-white/60 text-sm ml-2">• 5 days ago</span>
                  </div>
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm">
                    View Results
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Full Stack Developer</h3>
                <p className="text-white/70 text-sm mb-3">React, Node.js, PostgreSQL</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-green-400 font-semibold">Score: 92%</span>
                    <span className="text-white/60 text-sm ml-2">• 2 weeks ago</span>
                  </div>
                  <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm">
                    View Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
