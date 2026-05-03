import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, FileQuestion, Lightbulb, ListTodo, ShieldAlert, ArrowDown, Sparkles, Brain, Target, Cpu, CheckCircle2, TrendingUp, BarChart3, Shield, Star, Quote, Mail, ChevronDown, Twitter, Linkedin, Github, ArrowRight, Play, Users, Lock, Globe, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroDashboard from '@/assets/hero-dashboard.jpg';
import featureIntake from '@/assets/feature-intake.jpg';
import featureSolutions from '@/assets/feature-solutions.jpg';
import featureExecution from '@/assets/feature-execution.jpg';
import featureMonitoring from '@/assets/feature-monitoring.jpg';
import InstantSolver from '@/components/landing/InstantSolver';

/* ─── Mesh Gradient Background ─── */
function MeshGradient() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, hsl(199 89% 48%) 0%, transparent 70%)', top: '-10%', left: '-10%' }}
        animate={{ x: [0, 100, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{ background: 'radial-gradient(circle, hsl(270 76% 60%) 0%, transparent 70%)', bottom: '10%', right: '-5%' }}
        animate={{ x: [0, -80, 0], y: [0, -50, 0], scale: [1, 1.3, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
        style={{ background: 'radial-gradient(circle, hsl(142 76% 48%) 0%, transparent 70%)', top: '50%', left: '40%' }}
        animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      />
    </div>
  );
}

/* ─── Interactive Particle Field ─── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let id: number;
    const particles: { x: number; y: number; ox: number; oy: number; vx: number; vy: number; s: number; o: number; h: number }[] = [];
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const handleMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handleMouse);

    for (let i = 0; i < 120; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      particles.push({ x, y, ox: x, oy: y, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, s: Math.random() * 2 + 0.5, o: Math.random() * 0.5 + 0.1, h: 199 + Math.random() * 71 });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      particles.forEach((p, i) => {
        const dmx = p.x - mx;
        const dmy = p.y - my;
        const dm = Math.sqrt(dmx * dmx + dmy * dmy);
        if (dm < 150) {
          const force = (150 - dm) / 150;
          p.vx += (dmx / dm) * force * 0.3;
          p.vy += (dmy / dm) * force * 0.3;
        }

        p.vx *= 0.98;
        p.vy *= 0.98;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},89%,60%,${p.o})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(199,89%,48%,${0.08 * (1 - d / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMouse); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />;
}

/* ─── Glass Card ─── */
function GlassCard({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }} className={`relative group ${className}`}>
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative bg-card/30 backdrop-blur-2xl border border-border/20 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent" />
        <div className="relative">{children}</div>
      </div>
    </motion.div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 30, stiffness: 100 });
  useEffect(() => { if (inView) mv.set(value); }, [inView, value, mv]);
  const display = useTransform(spring, (v) => `${Math.round(v)}${suffix}`);
  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ─── Typing Animation ─── */
function TypingText({ words }: { words: string[] }) {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[index];
    const timeout = setTimeout(() => {
      if (!deleting) {
        setDisplayed(word.slice(0, displayed.length + 1));
        if (displayed.length === word.length) {
          setTimeout(() => setDeleting(true), 2000);
        }
      } else {
        setDisplayed(word.slice(0, displayed.length - 1));
        if (displayed.length === 0) {
          setDeleting(false);
          setIndex((i) => (i + 1) % words.length);
        }
      }
    }, deleting ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [displayed, deleting, index, words]);

  return (
    <span className="inline-block">
      <span className="gradient-text">{displayed}</span>
      <span className="inline-block w-[3px] h-[0.8em] bg-primary ml-1 align-middle animate-pulse" />
    </span>
  );
}

/* ─── Feature Section with Tilt Image ─── */
function FeatureRow({ feature, index, image }: { feature: { icon: any; title: string; description: string; details: string[] }; index: number; image: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const isEven = index % 2 === 0;
  const imgRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rotateX.set(-y * 10);
    rotateY.set(x * 10);
  }, [rotateX, rotateY]);

  const handleMouseLeave = useCallback(() => {
    rotateX.set(0);
    rotateY.set(0);
  }, [rotateX, rotateY]);

  const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-8 lg:gap-16`}
    >
      <motion.div
        ref={imgRef}
        className="flex-1 w-full"
        style={{ rotateX: springRotateX, rotateY: springRotateY, perspective: 1000, transformStyle: 'preserve-3d' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative rounded-2xl overflow-hidden group">
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/30 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative rounded-2xl overflow-hidden">
            <img src={image} alt={feature.title} loading="lazy" width={960} height={640} className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <motion.div
              className="absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-card/60 backdrop-blur-xl border border-primary/30 flex items-center justify-center"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <feature.icon className="w-6 h-6 text-primary" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 w-full space-y-5">
        <motion.div
          initial={{ opacity: 0, x: isEven ? 30 : -30 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="h-[1px] w-12 bg-gradient-to-r from-primary/50 to-transparent" />
          </div>
          <h3 className="text-3xl md:text-4xl font-extrabold">{feature.title}</h3>
          <p className="text-muted-foreground text-lg mt-3 leading-relaxed">{feature.description}</p>
          <ul className="mt-6 space-y-3">
            {feature.details.map((d, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <span className="text-muted-foreground">{d}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Floating Badge ─── */
function FloatingBadge({ icon: Icon, label, className, delay }: { icon: any; label: string; className: string; delay: number }) {
  return (
    <motion.div
      className={`absolute px-4 py-2 rounded-xl bg-card/60 backdrop-blur-2xl border border-border/30 flex items-center gap-2 shadow-lg ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
      transition={{ opacity: { delay: delay + 0.5, duration: 0.5 }, scale: { delay: delay + 0.5, duration: 0.5 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut', delay } }}
    >
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-xs font-semibold">{label}</span>
    </motion.div>
  );
}

/* ─── Testimonial Card ─── */
function TestimonialCard({ testimonial, index }: { testimonial: { name: string; role: string; company: string; text: string; avatar: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.15, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="relative group"
    >
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative bg-card/30 backdrop-blur-2xl border border-border/20 rounded-2xl p-6 sm:p-8 h-full flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent rounded-2xl" />
        <div className="relative flex-1">
          <Quote className="w-8 h-8 text-primary/20 mb-4" />
          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-primary fill-primary" />
            ))}
          </div>
          <p className="text-muted-foreground leading-relaxed mb-6">"{testimonial.text}"</p>
          <div className="flex items-center gap-3 mt-auto">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {testimonial.avatar}
            </div>
            <div>
              <p className="font-semibold text-sm">{testimonial.name}</p>
              <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── FAQ Item ─── */
function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border-b border-border/20 last:border-0"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="font-semibold text-sm sm:text-base pr-4 group-hover:text-primary transition-colors">{question}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-muted-foreground text-sm leading-relaxed pb-5 pr-8">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Marquee Logos ─── */
function LogoMarquee() {
  const logos = ['TechCorp', 'Axiom AI', 'NovaStar', 'Quantum Labs', 'Apex Systems', 'DataForge', 'ClearPath', 'SyncWave'];
  return (
    <div className="relative overflow-hidden py-6">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />
      <motion.div
        className="flex gap-12 items-center"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {[...logos, ...logos].map((logo, i) => (
          <div key={i} className="flex-shrink-0 px-6 py-3 rounded-xl border border-border/10 bg-card/10 backdrop-blur-sm">
            <span className="text-muted-foreground/50 font-semibold text-sm whitespace-nowrap tracking-wider">{logo}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Live Demo Simulator ─── */
function DemoSimulator() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'Problem Detected', detail: '"Revenue dropped 23% in Q3"', color: 'text-destructive' },
    { label: 'Root Cause Found', detail: '3 root causes identified by AI', color: 'text-primary' },
    { label: 'Solutions Scored', detail: 'Top solution: 94/100 effectiveness', color: 'text-primary' },
    { label: 'Execution Live', detail: '12 atomic tasks auto-generated', color: 'text-primary' },
    { label: 'Problem Resolved', detail: 'Revenue recovered +31% in 6 weeks', color: 'hsl(142,76%,48%)' },
  ];

  useEffect(() => {
    const interval = setInterval(() => setStep((s) => (s + 1) % steps.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-500 ${i <= step ? 'bg-card/40 border border-border/20' : 'opacity-30'}`}
          animate={i === step ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 1, repeat: i === step ? Infinity : 0 }}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-[hsl(142,76%,36%)] text-foreground' : i === step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {i < step ? '✓' : i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{s.label}</p>
            <p className="text-xs text-muted-foreground truncate">{s.detail}</p>
          </div>
          {i === step && (
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Main Page ─── */
export default function Index() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.92]);
  const heroY = useTransform(scrollYProgress, [0, 0.15], [0, -60]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const features = [
    { icon: FileQuestion, title: 'Problem Intake', description: 'AI-powered root cause analysis with structured problem profiles that cut through noise.', details: ['Natural language problem description', 'Auto-detected symptoms & constraints', 'AI root cause decomposition', 'Stakeholder impact mapping'] },
    { icon: Lightbulb, title: 'Solution Generation', description: 'Generate and score solutions across 6 dimensions — no more gut-feel decisions.', details: ['Multi-dimensional scoring matrix', 'Cost, speed, risk & leverage analysis', 'Second-order effect prediction', 'Elimination tournament ranking'] },
    { icon: ListTodo, title: 'Execution Planning', description: 'Atomic tasks with owners, deadlines, dependencies, and real-time KPI tracking.', details: ['Auto-generated task breakdown', 'Dependency chain visualization', 'Owner assignment & deadlines', 'Live KPI progress tracking'] },
    { icon: ShieldAlert, title: 'Risk Monitoring', description: 'Automated kill-switches that trigger before problems escalate beyond recovery.', details: ['Real-time threshold monitoring', 'Automated kill-switch triggers', 'Risk escalation protocols', 'Post-mortem analysis engine'] },
  ];
  const featureImages = [featureIntake, featureSolutions, featureExecution, featureMonitoring];

  const stats = [
    { value: 500, suffix: '+', label: 'Problems Solved', icon: Target },
    { value: 98, suffix: '%', label: 'Success Rate', icon: TrendingUp },
    { value: 10, suffix: 'x', label: 'Faster Resolution', icon: Zap },
    { value: 50, suffix: '+', label: 'Enterprise Teams', icon: BarChart3 },
  ];

  const testimonials = [
    { name: 'Sarah Chen', role: 'VP of Operations', company: 'TechCorp', text: 'Ruthless OS cut our problem resolution time by 8x. The AI root cause analysis alone saved us hundreds of hours.', avatar: 'SC' },
    { name: 'Marcus Rivera', role: 'CEO', company: 'Axiom AI', text: "The kill-switch system caught a critical production issue before it hit customers. That alone paid for a year's subscription.", avatar: 'MR' },
    { name: 'Dr. Anika Patel', role: 'CTO', company: 'NovaStar', text: 'We went from gut-feel decisions to data-driven execution. The solution scoring matrix changed how our entire team operates.', avatar: 'AP' },
  ];

  const faqs = [
    { question: 'How does the AI analyze problems?', answer: 'Our AI uses multi-layered root cause decomposition, analyzing symptoms, constraints, and stakeholder impacts to identify the true source of any problem. It draws from frameworks like the 5 Whys, Ishikawa, and systems thinking.' },
    { question: 'What makes the solution scoring different?', answer: 'Solutions are scored across 6 dimensions: effectiveness, cost, speed, risk, leverage, and reversibility. This eliminates gut-feel decisions and surfaces the objectively best path forward.' },
    { question: 'Can I use this for any type of problem?', answer: 'Yes. Ruthless OS is domain-agnostic — it works for operational, strategic, technical, and organizational problems. Enterprise teams use it across engineering, product, operations, and executive decision-making.' },
    { question: 'What are kill-switches?', answer: 'Kill-switches are automated safeguards that monitor KPI thresholds during execution. If a metric drops below a critical threshold, the system automatically pauses execution and escalates — preventing catastrophic failures before they compound.' },
    { question: 'Is my data secure?', answer: 'Absolutely. All data is encrypted at rest and in transit. We use enterprise-grade security with SOC 2 compliance, role-based access control, and data isolation between organizations.' },
    { question: 'How long does it take to get started?', answer: 'You can start solving problems in under 5 minutes. No complex onboarding, no lengthy setup. Just describe your problem and let the AI guide you through the process.' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden scroll-smooth">
      <MeshGradient />
      <ParticleField />

      {/* ─── Navbar ─── */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-4 mt-4">
          <div className="bg-card/20 backdrop-blur-2xl border border-border/20 rounded-2xl px-6 py-3 flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                animate={{ boxShadow: ['0 0 15px hsl(199 89% 48% / 0.2)', '0 0 30px hsl(199 89% 48% / 0.4)', '0 0 15px hsl(199 89% 48% / 0.2)'] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Zap className="w-5 h-5 text-primary-foreground" />
              </motion.div>
              <div>
                <h1 className="font-bold text-lg">Ruthless OS</h1>
                <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Problem Solver</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
                Dashboard
              </Button>
              <Button onClick={() => navigate('/dashboard')} size="sm" className="neon-glow group">
                Launch App
                <motion.span className="inline-block" animate={{ x: [0, 3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <ChevronRight className="w-4 h-4" />
                </motion.span>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ─── Hero ─── */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale, y: heroY }} className="relative z-10 min-h-screen flex items-center justify-center pt-28 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="space-y-8">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/[0.08] border border-primary/15 text-primary text-sm font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  Enterprise AI Problem-Solving
                </motion.div>

                <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.95] tracking-tight">
                  Solve Problems
                  <br />
                  <TypingText words={['Ruthlessly', 'Precisely', 'Intelligently', 'Decisively']} />
                </motion.h2>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                  A 4-step AI system that intakes problems, generates scored solutions, plans atomic execution, and monitors risk with automated kill-switches.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-4">
                  <Button onClick={() => navigate('/dashboard')} size="lg" className="text-base px-8 py-6 neon-glow group relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      Start Solving
                      <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <ChevronRight className="w-5 h-5" />
                      </motion.span>
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    />
                  </Button>
                  <Button variant="outline" size="lg" className="text-base px-8 py-6 backdrop-blur-xl border-border/30 hover:border-primary/30 transition-colors" onClick={() => navigate('/intake')}>
                    Explore Demo
                  </Button>
                </motion.div>

                {/* Social proof micro */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-2">
                    {['SC', 'MR', 'AP', 'JK'].map((initials, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                        {initials}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="text-foreground font-semibold">500+</span> teams solving problems
                  </div>
                </motion.div>
              </motion.div>

              {/* Hero Image */}
              <motion.div
                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden">
                  <motion.div
                    className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-primary via-[hsl(270,76%,60%)] to-primary bg-[length:200%_100%]"
                    animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  />
                  <div className="relative m-[2px] rounded-2xl overflow-hidden">
                    <img src={heroDashboard} alt="Ruthless OS AI Dashboard - Command Center" width={1920} height={1080} className="w-full h-auto object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-background/20" />
                  </div>
                </div>

                <FloatingBadge icon={Brain} label="AI-Powered" className="-bottom-3 -left-3 sm:-bottom-4 sm:-left-4" delay={0} />
                <FloatingBadge icon={Target} label="98% Accuracy" className="-top-3 -right-3 sm:-top-4 sm:-right-4" delay={1.5} />
                <FloatingBadge icon={Shield} label="Kill-Switch Active" className="bottom-12 -right-3 sm:-right-6 hidden sm:flex" delay={3} />
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="flex justify-center mt-16">
              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex flex-col items-center gap-2 text-muted-foreground">
                <span className="text-xs uppercase tracking-widest">Scroll</span>
                <ArrowDown className="w-4 h-4" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ─── Instant Solver ─── */}
      <InstantSolver />

      {/* ─── Trusted By Logos ─── */}
      <section className="relative z-10 py-8">
        <div className="container mx-auto px-6 max-w-5xl">
          <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center text-xs text-muted-foreground/50 uppercase tracking-[0.3em] mb-4">
            Trusted by forward-thinking teams
          </motion.p>
          <LogoMarquee />
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="relative z-10 py-12">
        <div className="container mx-auto px-6 max-w-5xl">
          <GlassCard>
            <div className="grid grid-cols-2 md:grid-cols-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 sm:p-8 text-center relative"
                >
                  {i < stats.length - 1 && <div className="absolute right-0 top-1/4 bottom-1/4 w-[1px] bg-border/20 hidden md:block" />}
                  <stat.icon className="w-5 h-5 text-primary mx-auto mb-2 opacity-60" />
                  <div className="text-3xl sm:text-4xl font-extrabold gradient-text">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ─── Features with Images ─── */}
      <section id="features" className="relative z-10 py-24 scroll-mt-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-20">
            <span className="text-xs text-primary font-semibold uppercase tracking-[0.25em]">The Process</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mt-4">
              Four Pillars of <span className="gradient-text">Ruthless Execution</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">Each step is engineered for maximum impact with AI-driven precision.</p>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-32">
            {features.map((feature, i) => (
              <FeatureRow key={feature.title} feature={feature} index={i} image={featureImages[i]} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Live Demo Preview ─── */}
      <section id="demo" className="relative z-10 py-24 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
              <span className="text-xs text-primary font-semibold uppercase tracking-[0.25em]">Live Preview</span>
              <h2 className="text-4xl md:text-5xl font-extrabold">
                Watch AI Solve a <span className="gradient-text">Real Problem</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                See the entire 4-step process in action — from problem intake to resolution — automated and precise.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  { icon: Clock, label: 'Under 5 min setup' },
                  { icon: Lock, label: 'Enterprise security' },
                  { icon: Globe, label: 'Works everywhere' },
                  { icon: Award, label: 'SOC 2 compliant' },
                ].map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </motion.div>
                ))}
              </div>
              <Button onClick={() => navigate('/intake')} size="lg" className="mt-4 neon-glow group">
                <Play className="w-4 h-4 mr-2" />
                Try It Yourself
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            <GlassCard delay={0.2}>
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-[hsl(142,76%,48%)]/60" />
                  <span className="text-xs text-muted-foreground ml-2 font-mono">ruthless-os-demo</span>
                </div>
                <DemoSimulator />
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* ─── Process Flow ─── */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6 max-w-5xl">
          <GlassCard>
            <div className="p-8 sm:p-12">
              <div className="text-center mb-12">
                <span className="text-xs text-primary font-semibold uppercase tracking-[0.25em]">Workflow</span>
                <h2 className="text-3xl md:text-4xl font-extrabold mt-3">The <span className="gradient-text">Ruthless</span> Flow</h2>
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { step: 1, title: 'Intake', desc: 'Define with AI clarity', icon: FileQuestion },
                  { step: 2, title: 'Generate', desc: 'AI scores & ranks', icon: Lightbulb },
                  { step: 3, title: 'Execute', desc: 'Atomic precision', icon: ListTodo },
                  { step: 4, title: 'Monitor', desc: 'Kill-switches active', icon: ShieldAlert },
                ].map((item, i) => (
                  <motion.div key={item.step} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} className="relative text-center group">
                    {i < 3 && <div className="hidden md:block absolute top-8 left-[60%] right-[-40%] h-[1px] bg-gradient-to-r from-primary/20 to-transparent" />}
                    <motion.div whileHover={{ scale: 1.1, y: -4 }} className="w-16 h-16 mx-auto rounded-2xl bg-primary/[0.06] border border-primary/15 flex items-center justify-center mb-4 relative transition-colors group-hover:border-primary/30">
                      <item.icon className="w-7 h-7 text-primary" />
                      <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">{item.step}</span>
                    </motion.div>
                    <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section id="testimonials" className="relative z-10 py-24 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-xs text-primary font-semibold uppercase tracking-[0.25em]">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-4">
              Loved by <span className="gradient-text">Enterprise Teams</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">See what leaders say about transforming their problem-solving process.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="relative z-10 py-24 scroll-mt-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
            <span className="text-xs text-primary font-semibold uppercase tracking-[0.25em]">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-extrabold mt-4">
              Common <span className="gradient-text">Questions</span>
            </h2>
          </motion.div>
          <GlassCard>
            <div className="p-6 sm:p-8">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} index={i} />
              ))}
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ─── Email Capture ─── */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6 max-w-2xl">
          <GlassCard>
            <div className="p-8 sm:p-12 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Mail className="w-10 h-10 text-primary mx-auto mb-4 opacity-60" />
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">Stay Ruthlessly Informed</h2>
                <p className="text-muted-foreground mb-6">Get product updates, AI insights, and problem-solving frameworks. No spam, ever.</p>
                {subscribed ? (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center gap-2 text-primary font-semibold">
                    <CheckCircle2 className="w-5 h-5" />
                    You're in. Welcome to the ruthless side.
                  </motion.div>
                ) : (
                  <form onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border/30 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all text-sm"
                    />
                    <Button type="submit" className="neon-glow px-6 whitespace-nowrap">
                      Subscribe
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </form>
                )}
              </motion.div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative z-10 py-24">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <div className="relative rounded-3xl overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary via-[hsl(270,76%,60%)] to-primary bg-[length:200%_100%]"
                animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              />
              <div className="relative m-[2px] bg-card/95 backdrop-blur-2xl rounded-3xl p-12 sm:p-16 text-center">
                <motion.div
                  className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4">
                  Ready to Solve Problems<br /><span className="gradient-text">Ruthlessly</span>?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-lg">Join enterprise teams using AI to eliminate guesswork and execute with precision.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/dashboard')} size="lg" className="text-lg px-10 py-6 neon-glow relative overflow-hidden group">
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started Free
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
                    />
                  </Button>
                  <Button variant="outline" size="lg" className="text-lg px-10 py-6 backdrop-blur-xl border-border/30 hover:border-primary/30" onClick={() => navigate('/intake')}>
                    <Play className="w-4 h-4 mr-2" />
                    Watch Demo
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 border-t border-border/10">
        <div className="container mx-auto px-6 max-w-6xl py-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="md:col-span-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center neon-glow">
                  <Zap className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Ruthless OS</h3>
                  <p className="text-[10px] text-muted-foreground tracking-[0.2em] uppercase">Problem Solver</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enterprise AI that turns complex problems into executed solutions.
              </p>
              <div className="flex gap-3">
                {[Twitter, Linkedin, Github].map((Icon, i) => (
                  <motion.a key={i} href="#" whileHover={{ scale: 1.1, y: -2 }} className="w-9 h-9 rounded-lg bg-muted/30 border border-border/20 flex items-center justify-center hover:border-primary/30 transition-colors">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground/70">Product</h4>
              <ul className="space-y-2.5">
                {['Problem Intake', 'Solution Scoring', 'Execution Planner', 'Risk Monitor'].map((item) => (
                  <li key={item}><a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground/70">Company</h4>
              <ul className="space-y-2.5">
                {['About', 'Careers', 'Blog', 'Contact'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground/70">Legal</h4>
              <ul className="space-y-2.5">
                {['Privacy Policy', 'Terms of Service', 'Security', 'SOC 2'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-border/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 Ruthless OS. Built for teams that refuse to fail.</p>
            <p className="text-xs text-muted-foreground/50">Made with ruthless precision.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
