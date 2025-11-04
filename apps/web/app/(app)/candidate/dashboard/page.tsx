export default function CandidateDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            My Dashboard
          </h1>
          <p className="text-lg text-white/80">
            Track your interview invitations and progress
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Pending Interviews</h3>
            <p className="text-4xl font-bold text-white">2</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Completed</h3>
            <p className="text-4xl font-bold text-white">3</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Total Score</h3>
            <p className="text-4xl font-bold text-white">85%</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Your Interviews</h2>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-semibold">Frontend Developer Interview</h3>
                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm">
                  Pending
                </span>
              </div>
              <p className="text-white/70 text-sm mb-2">Invited 2 days ago</p>
              <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors">
                Start Interview
              </button>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-white font-semibold">Senior Backend Engineer</h3>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                  Completed
                </span>
              </div>
              <p className="text-white/70 text-sm mb-2">Completed 5 days ago • Score: 88%</p>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors">
                View Results
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
