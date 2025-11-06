export default function HRDashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            HR Dashboard
          </h1>
          <p className="text-lg text-white/80">
            Manage interviews and review candidates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Active Interviews</h3>
            <p className="text-4xl font-bold text-white">5</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Pending Reviews</h3>
            <p className="text-4xl font-bold text-white">12</p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-white/80 text-sm font-medium mb-2">Total Candidates</h3>
            <p className="text-4xl font-bold text-white">48</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/hr/interviews"
              className="block p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
            >
              <h3 className="text-white font-semibold mb-1">Manage Interviews</h3>
              <p className="text-white/70 text-sm">Create and manage interview templates</p>
            </a>
            
            <a
              href="/hr/candidates"
              className="block p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-all"
            >
              <h3 className="text-white font-semibold mb-1">Review Candidates</h3>
              <p className="text-white/70 text-sm">View and evaluate candidate responses</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
