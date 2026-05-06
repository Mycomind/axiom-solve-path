import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileQuestion,
  Lightbulb,
  ListTodo,
  ShieldAlert,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Menu,
  X,
  Sparkles,
  Download,
  Swords
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FileQuestion, label: 'Problem Intake', path: '/intake' },
  { icon: Lightbulb, label: 'Solutions', path: '/solutions' },
  { icon: ListTodo, label: 'Execution', path: '/execution' },
  { icon: ShieldAlert, label: 'Risk Monitor', path: '/monitoring' },
  { icon: Sparkles, label: 'AI Coach', path: '/coach' },
  { icon: Swords, label: 'Debate Room', path: '/debate' },
  { icon: Download, label: 'Prompt Export', path: '/prompt-export' },
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: Shield, label: 'Admin', path: '/admin' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const MobileMenuButton = () => (
    <button
      onClick={() => setMobileOpen(true)}
      className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-sidebar border border-sidebar-border md:hidden"
      aria-label="Open menu"
    >
      <Menu className="w-6 h-6 text-foreground" />
    </button>
  );

  const MobileOverlay = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setMobileOpen(false)}
      className="fixed inset-0 bg-black/60 z-40 md:hidden"
    />
  );

  const SidebarContent = ({ isMobileView = false }: { isMobileView?: boolean }) => (
    <motion.aside
      initial={false}
      animate={{ width: isMobileView ? 280 : collapsed ? 80 : 260 }}
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col z-50 h-screen",
        isMobileView ? "fixed left-0 top-0" : "fixed left-0 top-0 hidden md:flex"
      )}
    >
      <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center neon-glow">
            <Zap className="w-6 h-6 text-primary-foreground" />
          </div>
          {(isMobileView || !collapsed) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <h1 className="font-bold text-lg text-foreground">Ruthless OS</h1>
              <p className="text-xs text-muted-foreground">Problem Solver</p>
            </motion.div>
          )}
        </div>
        {isMobileView && (
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors" aria-label="Close menu">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-primary/10 text-primary neon-glow"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {(isMobileView || !collapsed) && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-medium">
                  {item.label}
                </motion.span>
              )}
              {isActive && (
                <motion.div
                  layoutId={isMobileView ? "activeIndicatorMobile" : "activeIndicator"}
                  className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {!isMobileView && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}
    </motion.aside>
  );

  return (
    <>
      {isMobile && !mobileOpen && <MobileMenuButton />}
      <SidebarContent isMobileView={false} />
      <AnimatePresence>
        {mobileOpen && (
          <>
            <MobileOverlay />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="md:hidden"
            >
              <SidebarContent isMobileView={true} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
