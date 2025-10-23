export default function Loader() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="text-center p-8 rounded-2xl bg-gray-50/80 backdrop-blur-sm border border-gray-100 shadow-lg animate-fadeInUp mx-4 relative">
        
        <div className="relative z-10">
          {/* Lightbulb-inspired spinner */}
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto relative">
              {/* Outer ring with colorful segments */}
              <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
              <div 
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-400 border-r-green-400 border-b-blue-400 border-l-purple-400 animate-spin"
                style={{animationDuration: '1.5s'}}
              ></div>
              
              {/* Inner brain/lightbulb icon */}
              <div className="absolute inset-3 bg-orange-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-gray-400 rounded-full opacity-60"></div>
              </div>
            </div>
          </div>
          
          {/* Loading text - matching the home page typography */}
          <h4 className="text-xl font-medium mb-2 text-gray-800">
            Loading your dashboard...
          </h4>
          <p className="text-gray-500 text-sm">
            Please wait while we verify your credentials
          </p>
          
          {/* Animated dots */}
          <div className="flex justify-center mt-4 space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}