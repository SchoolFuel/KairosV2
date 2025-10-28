import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Filter, X, Loader2, AlertCircle, Check } from 'lucide-react';
import StandardCard from './StandardCard';

const LearningStandardsDialog = ({ preSelectedStandards = [] }) => {
  const [allStandards, setAllStandards] = useState([]);
  const [selectedStandards, setSelectedStandards] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load standards on mount
  useEffect(() => {
    // Set pre-selected standards immediately if available
    if (preSelectedStandards.length > 0) {
      setSelectedStandards(preSelectedStandards.map(s => s.code));
    }

    // Load standards from Google Apps Script
    google.script.run
      .withSuccessHandler((data) => {
        if (data && data.sheets && data.sheets[0]) {
          setAllStandards(data.sheets[0].data);
        } else {
          setError('No standards data found');
        }
        setLoading(false);
      })
      .withFailureHandler((error) => {
        setError('Error loading standards: ' + error.message);
        setLoading(false);
      })
      .getLearningStandards();
  }, [preSelectedStandards]);

  // Get unique grades and subjects for filters
  const { grades, subjects } = useMemo(() => {
    const grades = [...new Set(allStandards.map(s => s.grade_level))].sort();
    const subjects = [...new Set(allStandards.map(s => s.subject_area))].sort();
    return { grades, subjects };
  }, [allStandards]);

  // Filter standards based on search and filters
  const filteredStandards = useMemo(() => {
    return allStandards.filter(standard => {
      const matchesSearch = searchTerm === '' || 
        standard.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        standard.code.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesGrade = gradeFilter === 'all' || standard.grade_level === gradeFilter;
      const matchesSubject = subjectFilter === 'all' || standard.subject_area === subjectFilter;
      
      return matchesSearch && matchesGrade && matchesSubject;
    });
  }, [allStandards, searchTerm, gradeFilter, subjectFilter]);

  // Toggle standard selection
  const toggleStandard = useCallback((code) => {
    setSelectedStandards(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setGradeFilter('all');
    setSubjectFilter('all');
  }, []);

  // Confirm selection
  const confirmSelection = useCallback(() => {
    const selected = allStandards.filter(s => selectedStandards.includes(s.code));
    
    google.script.run
      .withSuccessHandler(() => {
        google.script.host.close();
      })
      .receiveSelectedStandardsFromDialog(selected);
  }, [allStandards, selectedStandards]);

  // Close dialog
  const closeDialog = useCallback(() => {
    google.script.run
      .withSuccessHandler(() => {
        google.script.host.close();
      })
      .onDialogClosedWithoutSelection();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by description or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-600" />
              <span className="text-sm font-semibold text-gray-700">Filters:</span>
            </div>
            
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">All Grades</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
            >
              Clear Filters
            </button>

            <div className="ml-auto flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
              <span className="text-sm font-semibold text-blue-700">
                {selectedStandards.length} selected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Standards List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="text-center">
              <Loader2 className="animate-spin h-10 w-10 mx-auto mb-3" />
              <p className="text-lg font-medium">Loading standards...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <X className="mx-auto mb-4 text-red-400" size={64} />
              <p className="text-lg font-semibold text-red-600 mb-1">Error</p>
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          </div>
        ) : filteredStandards.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 opacity-50" size={64} />
              <p className="text-lg font-semibold text-gray-600 mb-1">No standards found</p>
              <p className="text-sm text-gray-500">Try adjusting your filters or search term</p>
            </div>
          </div>
        ) : (
          filteredStandards.map(standard => (
            <StandardCard
              key={standard.code}
              standard={standard}
              isSelected={selectedStandards.includes(standard.code)}
              onToggle={toggleStandard}
            />
          ))
        )}
      </div>

      {/* Fixed Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 font-medium">
            {filteredStandards.length} standard{filteredStandards.length !== 1 ? 's' : ''} available
          </p>
          <div className="flex gap-3">
            <button
              onClick={closeDialog}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={confirmSelection}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm hover:shadow flex items-center gap-2"
            >
              <span>Add Standards</span>
              <span className="bg-blue-700 px-2 py-0.5 rounded text-sm">
                {selectedStandards.length}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningStandardsDialog;