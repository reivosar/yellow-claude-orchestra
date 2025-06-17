'use client'

import React from 'react'

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        Debug Page - Testing White Screen Issue
      </h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <p>If you can see this, the basic React setup is working.</p>
        <p>Project data is stored in: <code>/Users/mac/Workspace/yellow-claude-orchestra/data/projects.json</code></p>
        <p>Claude Code CLI will be used to interact with project files when tasks are created.</p>
      </div>
    </div>
  )
}