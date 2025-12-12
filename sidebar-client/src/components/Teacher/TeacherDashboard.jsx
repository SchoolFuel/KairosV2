import React from "react";
import ProjectQueueCard from "./ProjectQueue/ProjectQueue";
import Ignite from "../Shared/Ignite/Ignite";

export default function TeacherDashboard() {
  return (
    <>
      <ProjectQueueCard />
      <Ignite />

      {/* Add more components here as needed */}
    </>
  );
}