import React, { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Loader2, 
  ChevronDown, 
  ArrowRight, 
  User, 
  Building, 
  Mail, 
  Target, 
  Tag,
  Copy,
  Plus,
  Download,
  X,
  Users
} from 'lucide-react';

export default function ExpertFinderComponent() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [topic, setTopic] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [experts, setExperts] = useState([]);
  const [selectedExperts, setSelectedExperts] = useState(new Set());
  const [searchStatus, setSearchStatus] = useState('');
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!topic.trim() || !location.trim()) return;
    
    setIsLoading(true);
    setSearchStatus('Searching for experts...');
    setSearchCompleted(false);
    setExperts([]);
    setError(null);
    
    try {
      setSearchStatus('Analyzing expertise in your area...');
      
      const payload = {
          message: topic.trim(),
          geolocation: location.trim(),
      };
      const result = await new Promise((resolve, reject) => {
        google.script.run
          .withSuccessHandler(resolve)
          .withFailureHandler(reject)
          .findExperts(payload);
      });

      if (result.status === "success" && result.action_response.json) {
        setExperts(result.action_response.json.map((expert, index) => ({
          id: index + 1,
          ...expert
        })));
        setSearchCompleted(true);
      } else {
        setError("No experts found for your search criteria.");
        setSearchCompleted(true);
      }
      setIsLoading(false);
      setSearchStatus('');

    } catch (err) {
      console.error('Error searching for experts:', err);
      setError("Sorry, there was an error searching for experts. Please try again.");
      setIsLoading(false);
      setSearchCompleted(true);
      setSearchStatus('');
    }
  };

  const toggleExpertSelection = (expertId) => {
    const newSelected = new Set(selectedExperts);
    if (newSelected.has(expertId)) {
      newSelected.delete(expertId);
    } else {
      newSelected.add(expertId);
    }
    setSelectedExperts(newSelected);
  };

  const handleClear = () => {
    setTopic('');
    setLocation('');
    setExperts([]);
    setSelectedExperts(new Set());
    setSearchCompleted(false);
    setError(null);
  };

  const getStatusConfig = () => {
    if (isLoading) return {
      color: "text-yellow-500",
      dot: "bg-yellow-400 shadow-yellow-400/50",
      subtitle: "Searching...",
      subtitleColor: "text-yellow-600"
    };
    if (error || (searchCompleted && experts.length === 0)) return {
      color: "text-red-500",
      dot: "bg-red-400 shadow-red-400/50",
      subtitle: "No experts found",
      subtitleColor: "text-red-600"
    };
    if (experts.length > 0) return {
      color: "text-green-500",
      dot: "bg-green-400 shadow-green-400/50",
      subtitle: `${experts.length} experts found!`,
      subtitleColor: "text-green-600"
    };
    return {
      color: "text-gray-500",
      dot: "bg-gray-400",
      subtitle: "Find experts you need",
      subtitleColor: "text-gray-600"
    };
  };

  const status = getStatusConfig();

  const buildExpertsText = () => {
    const selectedExpertsList = experts.filter(expert => selectedExperts.has(expert.id));
    return selectedExpertsList.map(expert => 
      `${expert.full_name} - ${expert.organization}\nEmail: ${expert.email}\nBio: ${expert.bio}\nSkills: ${expert.skills.join(', ')}\nTags: ${expert.tags.join(', ')}\nAction: ${expert.action}`
    ).join('\n\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildExpertsText());
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const ExpertCard = ({ expert }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{expert.full_name}</h3>
              <div className="flex items-center gap-1 mb-2">
                <Building className="w-3 h-3 text-blue-600" />
                <p className="text-xs text-blue-600 font-medium">{expert.organization}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed mb-3">{expert.bio}</p>
        </div>
        <input
          type="checkbox"
          checked={selectedExperts.has(expert.id)}
          onChange={() => toggleExpertSelection(expert.id)}
          className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 flex-shrink-0 ml-2"
        />
      </div>

      {/* Action Section */}
      {expert.action && (
        <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
          <div className="flex items-center gap-1 mb-1">
            <Target className="w-3 h-3 text-green-600" />
            <h4 className="text-xs font-medium text-green-900">Recommended Action</h4>
          </div>
          <p className="text-xs text-green-700 leading-relaxed">{expert.action}</p>
        </div>
      )}
      
      {/* Skills */}
      {expert.skills && expert.skills.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-900 mb-1">Skills & Expertise</h4>
          <div className="flex flex-wrap gap-1">
            {expert.skills.map((skill, index) => (
              <span key={index} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Tags */}
      {expert.tags && expert.tags.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 mb-1">
            <Tag className="w-3 h-3 text-emerald-600" />
            <h4 className="text-xs font-medium text-gray-900">Specialization Tags</h4>
          </div>
          <div className="flex flex-wrap gap-1">
            {expert.tags.map((tag, index) => (
              <span key={index} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-xs rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Contact */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Mail className="w-3 h-3 text-purple-600" />
          <span className="text-xs font-medium text-gray-900 mr-2">Contact:</span>
          <a href={`mailto:${expert.email}`} className="text-xs text-purple-600 hover:text-purple-800 underline">
            {expert.email}
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[300px] font-sans">
      {/* Main Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200">
        
        {/* Toggle Header */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-3 cursor-pointer transition-colors duration-200 hover:bg-gray-50"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className={`w-5 h-5 ${status.color}`} />
                <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${status.dot} shadow-sm`}></div>
              </div>
              <div>
                <div className="font-medium text-gray-900">Find Experts</div>
                <div className={`text-sm ${status.subtitleColor}`}>
                  {status.subtitle}
                </div>
              </div>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`} 
            />
          </div>
        </div>

        {/* Expandable Content */}
        {isExpanded && (
          <div className="border-t border-gray-100">
            {/* Header Section */}
            <div className="bg-purple-100 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Tap In. Reach Out. Get Help.</h2>
                  <p className="text-sm text-gray-700">
                    Help is everywhere! Let us help you find the experts you need.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Tell us what kind of expert you're looking for and where. Be specific about the topic, skills, or experience you need help with.
                </p>
              </div>

              {/* Input Form */}
              <div className="space-y-4">
                {/* Topic Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What topic or expertise do you need help with?
                  </label>
                  <textarea
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Climate change education and outreach"
                    rows={2}
                    disabled={isLoading}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>

                {/* Location Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (City, State or Region)
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., Mesa, AZ"
                      disabled={isLoading}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div>
                  <button
                    onClick={handleSearch}
                    disabled={!topic.trim() || !location.trim() || isLoading}
                    className="w-full bg-indigo-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Finding experts...</span>
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        <span>Find Experts</span>
                      </>
                    )}
                  </button>
                  
                  {!isLoading && (topic || location || experts.length > 0) && (
                    <button
                      onClick={handleClear}
                      className="w-full mt-2 bg-gray-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <X className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <span className="text-blue-800 font-medium text-sm">{searchStatus}</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              {/* Results */}
              {experts.length > 0 && !isLoading && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-2">
                      Found {experts.length} Expert{experts.length !== 1 ? 's' : ''}
                    </h2>
                    <p className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                      Select experts to connect with for your project!
                    </p>
                    <div className="text-sm text-gray-600 mt-2">
                      {selectedExperts.size} selected
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {experts.map((expert) => (
                      <ExpertCard key={expert.id} expert={expert} />
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {selectedExperts.size > 0 && (
                <div className="pt-4 border-t border-slate-200 space-y-2">
                  <button
                    onClick={copyToClipboard}
                    className="w-full bg-slate-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-slate-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy experts to clipboard</span>
                  </button>
                  
                  <button
                    onClick={() => alert("Added to your project!")}
                    className="w-full bg-green-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Project</span>
                  </button>
                  
                  <button
                    onClick={() => alert("PDF download is not available yet")}
                    className="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download as PDF</span>
                  </button>
                </div>
              )}

              {/* Tips Section */}
              {!experts.length && !isLoading && !error && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Tips for finding the right experts
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1 leading-relaxed">
                        <li>• Be specific about your topic or field of interest</li>
                        <li>• Include your city, state, or region for local experts</li>
                        <li>• Mention any particular skills or experience needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}