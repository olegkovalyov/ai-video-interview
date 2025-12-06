import { Edit2, Trash2, Building2, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Company } from '@/lib/api/companies';

interface CompaniesTableProps {
  companies: Company[];
  onEdit: (companyId: string) => void;
  onDelete: (companyId: string) => void;
  loadingCompanies?: Set<string>;
}

export function CompaniesTable({ 
  companies, 
  onEdit, 
  onDelete, 
  loadingCompanies = new Set() 
}: CompaniesTableProps) {
  if (companies.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-12 text-center">
          <Building2 className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No companies found</h3>
          <p className="text-white/70">Create your first company to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/20">
              <tr>
                <th className="text-left p-4 text-white/70 font-semibold">Company</th>
                <th className="text-left p-4 text-white/70 font-semibold">Industry</th>
                <th className="text-left p-4 text-white/70 font-semibold">Size</th>
                <th className="text-left p-4 text-white/70 font-semibold">Location</th>
                <th className="text-right p-4 text-white/70 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => {
                const isLoading = loadingCompanies.has(company.id);
                return (
                  <tr 
                    key={company.id}
                    className={`
                      border-b border-white/10 hover:bg-white/5 transition-all duration-200
                      ${isLoading ? 'opacity-60 blur-[0.5px]' : ''}
                    `}
                  >
                    {/* Company Name */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">{company.name}</div>
                          {company.website && (
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 text-xs hover:underline flex items-center gap-1"
                            >
                              Visit <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Industry */}
                    <td className="p-4">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-sm">
                        {company.industry}
                      </span>
                    </td>

                    {/* Size */}
                    <td className="p-4 text-white/80 text-sm">
                      {company.size}
                    </td>

                    {/* Location */}
                    <td className="p-4 text-white/80 text-sm">
                      {company.location || '—'}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(company.id)}
                          disabled={isLoading}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          onClick={() => onDelete(company.id)}
                          disabled={isLoading}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
