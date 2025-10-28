import { ShieldX } from 'lucide-react';

export default function UnauthorizedUser() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 w-full text-center">
        <div className="mb-5">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-lg font-semibold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            You don't have permission to access this resource.
          </p>
        </div>
        <button className="w-full bg-slate-700 hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-md text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Contact Administrator
        </button>
        <div className="mt-5 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-500">Error 403 - Forbidden</p>
        </div>
      </div>
    </div>
  );
}