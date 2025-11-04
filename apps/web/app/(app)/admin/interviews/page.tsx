export default function AdminInterviewsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            All Interview Templates
          </h1>
          <p className="text-lg text-white/80">
            Manage all interview templates across the platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Total Templates</h3>
            <p className="text-4xl font-bold text-white">24</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Active</h3>
            <p className="text-4xl font-bold text-white">18</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Total Responses</h3>
            <p className="text-4xl font-bold text-white">342</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Avg Score</h3>
            <p className="text-4xl font-bold text-white">84%</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Interview Templates by HR</h2>
          <div className="space-y-4">
            <div className="p-6 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl text-white font-semibold mb-1">Frontend Developer Interview</h3>
                  <p className="text-white/70">Created by Jane Smith (HR)</p>
                </div>
                <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                  Active
                </span>
              </div>
              <div className="flex gap-4 text-sm text-white/60 mb-4">
                <span>15 candidates</span>
                <span>•</span>
                <span>12 responses</span>
                <span>•</span>
                <span>Avg: 86%</span>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors">
                  View Details
                </button>
                <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-medium transition-colors">
                  Disable
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
