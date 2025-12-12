import React, { useState } from "react";
import { ChevronDown, Lightbulb } from "lucide-react";
import IgniteIcon from "./Ignite_Help_Icon.png";

export default function IgniteHelp() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Form state
  const [topicKey, setTopicKey] = useState("logon");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");

  // Loading + response state
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  // Topics
  const topics = [
    { key: "logon", label: "Logon Problem" },
    { key: "bug", label: "Report a Bug" },
    { key: "feature", label: "Feature Request" }
  ];

  // TODO: replace these with live session values
  const userId = "909eb26e-5d77-47cb-90be-674b1d2de7fd";
  const email = "student1@gmail.com";

  // --- SUBMIT HANDLER ---
  const handleSubmitTicket = () => {
    if (!description.trim()) {
      alert("Please describe your issue.");
      return;
    }

    setLoading(true);

    const payload = {
      action: "ignitehelp",
      payload: {
        route: "submit_help",
        user_id: userId,
        email: email,
        topicKey: topicKey,
        description: description,
        priority: priority,
        notify: true
      }
    };

    google.script.run
      .withSuccessHandler((res) => {
        const data = res?.action_response?.body?.data;
        setResponseData(data || null);
        setLoading(false);
      })
      .withFailureHandler((err) => {
        console.error("Ignite Help submit error", err);
        setLoading(false);
      })
      .handleIgniteHelp(payload);
  };

  return (
    <div className="w-full font-sans">
      <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-200">

        {/* HEADER */}
        <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3 cursor-pointer hover:bg-gray-50 transition"
        >
        <div className="flex items-center justify-between">

            {/* LEFT SIDE — icon + text + mascot */}
            <div className="flex items-center space-x-3">

            {/* Bulb icon (gray) + dot */}
            <div className="relative">
                <Lightbulb className="w-6 h-6 text-gray-500 stroke-[2.25]" />
                <div
                className="absolute -top-1 w-2 h-2 rounded-full bg-gray-400"
                style={{ right: "-0.05rem" }}
                ></div>
            </div>

            {/* Text block */}
            <div className="flex flex-col leading-tight">
                <span className="font-medium text-gray-900 text-base">
                Ignite Help
                </span>
                <span className="text-sm text-gray-500">Get Fast Help</span>
            </div>

            {/* Mascot — immediately after the text */}
            <img
                src={IgniteIcon}
                alt="Ignite Mascot"
                className="object-contain ml-1"
                style={{ width: "50px", height: "50px" }}   // adjust size here
            />
            </div>

            {/* RIGHT SIDE — dropdown arrow */}
            <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
            }`}
            />
        </div>
        </div>




        {/* EXPANDED PANEL */}
        {isExpanded && (
          <div className="p-4 border-t border-gray-100 bg-white">
            <div className="space-y-6">

              {/* ---- TOPIC SELECT ---- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose Topic
                </label>
                <select
                  value={topicKey}
                  onChange={(e) => setTopicKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
                             bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {topics.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ---- ISSUE DESCRIPTION ---- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Describe Your Issue
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe what happened…"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm 
                             resize-none bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* ---- PRIORITY ---- */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                             bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* ---- SUBMIT BUTTON ---- */}
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitTicket}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium 
                           rounded-md hover:bg-indigo-700 transition focus:ring-2 focus:ring-indigo-500
                           disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Ticket"}
              </button>

              {/* ---- RESPONSE SECTION ---- */}
              {responseData && (
                <div className="space-y-6 pt-4 border-t border-gray-200">

                  {/* SUCCESS MESSAGE */}
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Ticket Submitted Successfully
                    </p>
                  </div>

                  {/* ---- POSSIBLE SOLUTIONS ---- */}
                  {responseData.possible_solutions?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-2">
                        Possible Solutions
                      </h3>

                      <div className="space-y-2">
                        {responseData.possible_solutions.map((sol, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50 border border-gray-200 rounded-md"
                          >
                            <p className="font-medium text-gray-800">{sol.title}</p>
                            <a
                              href={sol.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 text-sm underline"
                            >
                              View Solution →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ---- SIMILAR RESOLUTIONS ---- */}
                  {responseData.similar_resolutions?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-2">
                        Related Help Articles
                      </h3>

                      <div className="space-y-2">
                        {responseData.similar_resolutions.map((item, idx) => {
                          const urlMatch = item.match(/\((.*?)\)$/);
                          const url = urlMatch ? urlMatch[1] : null;
                          const title = item
                            .replace(/\(.*?\)$/, "")
                            .replace("Possible solution: ", "");

                          return (
                            <div
                              key={idx}
                              className="p-3 bg-gray-50 border border-gray-200 rounded-md"
                            >
                              <p className="font-medium text-gray-800">{title}</p>
                              {url && (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 text-sm underline"
                                >
                                  View Article →
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ---- USER HISTORY ---- */}
                  {responseData.user_history?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-800 mb-2">
                        Your Past Requests
                      </h3>

                      <div className="space-y-2">
                        {responseData.user_history.map((h, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-white border border-gray-200 rounded-md shadow-sm"
                          >
                            <p className="font-medium text-gray-900">{h.topic}</p>
                            <p className="text-gray-600 text-sm">{h.description}</p>
                            <p className="text-gray-400 text-xs">{h.created_at}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
