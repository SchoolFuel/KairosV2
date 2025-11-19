import React from "react";
import ProjectQueueCard from "./ProjectQueue/ProjectQueue";
import ProjectReview from "./ProjectReview/ProjectReview";

export default function TeacherDashboard() {
  return (
    <>
      <ProjectQueueCard />
      <ProjectReview/>
      {/* Add more components here as needed */}
    </>
  );
}