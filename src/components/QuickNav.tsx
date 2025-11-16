"use client";

import { usePathname, useRouter } from "next/navigation";

export default function QuickNav({ selectedProject }: { selectedProject?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    {
      key: "contributors",
      label: "Đóng góp",
      href: selectedProject ? `/supervisor/contributor?project_id=${selectedProject}` : "/supervisor/contributor",
      projectScoped: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    
    {
      key: "task",
      label: "Công việc",
      href: selectedProject ? `/supervisor/task?project_id=${selectedProject}` : "/supervisor/task",
      projectScoped: false,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      key: "kanban",
      label: "Kanban Board",
      href: selectedProject ? `/supervisor/kanban-board?project_id=${selectedProject}` : "/supervisor/kanban-board",
      projectScoped: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      href: selectedProject ? `/supervisor/progress-task?project_id=${selectedProject}` : "/supervisor/progress-task",
      projectScoped: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    }
  ];

  return (
    <nav className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/80 p-1 shadow-sm">
      {items.map((it) => {
        const disabled = !selectedProject && it.projectScoped;
        const isActive = pathname?.startsWith(it.href.split('?')[0]);
        
        return (
          <button
            key={it.key}
            onClick={() => {
              if (!disabled) {
                router.push(it.href);
              }
            }}
            disabled={disabled}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              disabled
                ? 'opacity-40 cursor-not-allowed text-gray-400'
                : isActive
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                : 'text-slate-700 hover:bg-slate-100 hover:text-indigo-600'
            }`}
            title={disabled ? 'Vui lòng chọn project trước' : it.label}
          >
            {it.icon}
            <span className="hidden sm:inline">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
