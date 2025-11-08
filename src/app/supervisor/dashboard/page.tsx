"use client"

import { useState } from "react"
import ProjectsList, { initializeMockData } from "@/components/dashboard-supervisor/dashboad"
import ResponsiveSidebar from "@/components/ResponsiveSidebar"

export default function Page() {
  const [projects, setProjects] = useState(initializeMockData())
  return (
    <div className="min-h-screen bg-background">
      <ResponsiveSidebar />
      <main className="md:ml-64">
        <ProjectsList projects={projects} setProjects={setProjects} />
      </main>
    </div>
  )
}
