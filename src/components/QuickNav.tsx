"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function QuickNav({ selectedProject }: { selectedProject?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const items = [
    {
      key: "contributors",
      label: "Đóng góp",
      href: selectedProject ? `/supervisor/contributor?project_id=${selectedProject}` : "/supervisor/contributor",
      projectScoped: true,
    },
    {
      key: "feature",
      label: "Tính năng",

      href: selectedProject ? `/supervisor/feature?project_id=${selectedProject}` : "/supervisor/feature",
      projectScoped: false,
    },
    {
      key: "group",
      label: "Nhóm",
      href: "/messages",
      projectScoped: false,
    },
    {
      key: "task",
      label: "Đầu Công việc",
      href: selectedProject ? `/supervisor/task?project_id=${selectedProject}` : "/supervisor/task",
      projectScoped: false, // Task page can work without project
    },
    {
      key: "report",
      label: "Tài liệu",
      href: selectedProject ? `/supervisor/contributor/detail?project_id=${selectedProject}` : "/supervisor/contributor/detail",
      projectScoped: true,
    },
  ];

  return (
    <div className="relative inline-block text-left z-[9999]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-all relative z-[9999] ${
          open ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18M3 12h18M3 19h18"/></svg>
        Quick Nav
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-[9999]">
          <div className="py-1">
            {items.map((it) => {
              const disabled = !selectedProject && it.projectScoped;
              return (
                <button
                  key={it.key}
                  onClick={() => { if (!disabled) { setOpen(false); router.push(it.href); } }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${disabled ? 'opacity-70' : ''}`}
                >
                  {it.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
