// TeacherSelector.jsx
import React, { useState } from "react";
import { User, Check } from "lucide-react";

const TeacherSelector = ({ selectedTeacher, onSelectTeacher }) => {
  // Mock teacher data - replace with actual data from your backend
  const teachers = [
    {
      id: 1,
      name: "Ms. Sarah Johnson",
      subject: "Mathematics",
      avatar: "SJ",
      email: "sarah.johnson@school.edu",
    },
    {
      id: 2,
      name: "Mr. David Chen",
      subject: "Science",
      avatar: "DC",
      email: "david.chen@school.edu",
    },
    {
      id: 3,
      name: "Mrs. Emily Rodriguez",
      subject: "English",
      avatar: "ER",
      email: "emily.rodriguez@school.edu",
    },
    {
      id: 4,
      name: "Dr. Michael Brown",
      subject: "History",
      avatar: "MB",
      email: "michael.brown@school.edu",
    },
  ];

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Assign to Teacher <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teachers.map((teacher) => (
          <button
            key={teacher.id}
            type="button"
            onClick={() => onSelectTeacher(teacher)}
            className={`relative p-4 border-2 rounded-lg text-left transition-all ${
              selectedTeacher?.id === teacher.id
                ? "border-purple-500 bg-purple-50 shadow-md"
                : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${
                  selectedTeacher?.id === teacher.id
                    ? "bg-purple-600"
                    : "bg-gray-400"
                }`}
              >
                {teacher.avatar}
              </div>

              {/* Teacher Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 text-sm truncate">
                  {teacher.name}
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  {teacher.subject}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1">
                  {teacher.email}
                </p>
              </div>

              {/* Check Mark */}
              {selectedTeacher?.id === teacher.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        💡 Select a teacher who will review and approve your project stages
      </p>
    </div>
  );
};

export default TeacherSelector;