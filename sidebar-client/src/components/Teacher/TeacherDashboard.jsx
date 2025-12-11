import React from "react";
import ProjectQueueCard from "./ProjectQueue/ProjectQueue";
import ProjectReview from "./ProjectReview/ProjectReview";
import MyRoadmap from "./MyRoadmap/MyRoadmap";

export default function TeacherDashboard() {
  return (
    <>
      <ProjectQueueCard />
      <ProjectReview/>
      <MyRoadmap />
      {/* Add more components here as needed */}
    </>
  );
}