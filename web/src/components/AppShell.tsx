import type { ReactNode } from "react";
import {
  BarChart3,
  Briefcase,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Mic,
  User,
  Sparkles,
} from "lucide-react";

export type AppPage =
  | "dashboard"
  | "candidate"
  | "jobs"
  | "documents"
  | "assistant"
  | "interview";

interface AppShellProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  children: ReactNode;
}

interface NavigationItem {
  id: AppPage;
  label: string;
  icon: ReactNode;
}

const navigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: "candidate",
    label: "Candidate",
    icon: <User size={18} />,
  },
  {
    id: "jobs",
    label: "Jobs",
    icon: <Briefcase size={18} />,
  },
  {
    id: "documents",
    label: "CV & Cover Letter",
    icon: <FileText size={18} />,
  },
  {
    id: "assistant",
    label: "Career Assistant",
    icon: <MessageSquare size={18} />,
  },
  {
    id: "interview",
    label: "Interview",
    icon: <Mic size={18} />,
  },
];

export function AppShell({
  activePage,
  onNavigate,
  children,
}: AppShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          flexShrink: 0,
          borderRight: "1px solid var(--border-subtle)",
          background: "var(--bg-card)",
          padding: "24px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 12px 28px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, var(--primary), var(--accent))",
              boxShadow: "0 0 24px var(--primary-glow)",
            }}
          >
            <Sparkles
              size={19}
              color="#fff"
            />
          </div>

          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "-0.02em",
              }}
            >
              AI Career Agent
            </div>

            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--text-secondary)",
                marginTop: "2px",
              }}
            >
              Your career copilot
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          {navigationItems.map((item) => {
            const isActive =
              activePage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  onNavigate(item.id)
                }
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  border: "none",
                  borderRadius: "10px",
                  padding: "11px 12px",
                  cursor: "pointer",
                  textAlign: "left",
                  background: isActive
                    ? "var(--primary-glow)"
                    : "transparent",
                  color: isActive
                    ? "var(--text-primary)"
                    : "var(--text-secondary)",
                  fontSize: "0.9rem",
                  fontWeight: isActive
                    ? 600
                    : 500,
                  transition:
                    "background 0.2s ease, color 0.2s ease",
                }}
              >
                {item.icon}

                <span>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            padding: "16px 12px 4px",
            color: "var(--text-muted)",
            fontSize: "0.72rem",
            lineHeight: 1.5,
          }}
        >
          AI-powered career preparation
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}