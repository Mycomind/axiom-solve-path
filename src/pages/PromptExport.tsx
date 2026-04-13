import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Check, Loader2, Sparkles, FileText, Bot, Code, Cpu, Zap } from 'lucide-react';
import JSZip from 'jszip';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type GeneratedFile = { name: string; content: string };
type ProblemOption = { id: string; title: string; status: string };

const PLATFORMS = [
  {
    id: 'openclaw',
    name: 'OpenClaw',
    description: 'STRATOS-style 8-file agent system with logic graph, memory spine, and governance layer',
    icon: Zap,
    files: '8 files',
    color: 'text-yellow-400',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT / Custom GPTs',
    description: 'System prompt, conversation starters, and knowledge base for Custom GPTs',
    icon: Bot,
    files: '3 files',
    color: 'text-green-400',
  },
  {
    id: 'claude',
    name: 'Claude Projects',
    description: 'Project instructions and context documents for Claude',
    icon: Sparkles,
    files: '2 files',
    color: 'text-purple-400',
  },
  {
    id: 'cursor',
    name: 'Cursor / Windsurf',
    description: '.cursorrules file for AI-assisted coding on this problem',
    icon: Code,
    files: '1 file',
    color: 'text-blue-400',
  },
  {
    id: 'autogpt',
    name: 'AutoGPT / CrewAI',
    description: 'Multi-agent YAML configs with agent roles and task sequences',
    icon: Cpu,
    files: '2 files',
    color: 'text-red-400',
  },
  {
    id: 'generic',
    name: 'Generic / Universal',
    description: 'Works with any AI assistant — comprehensive prompt system',
    icon: FileText,
    files: '1 file',
    color: 'text-muted-foreground',
  },
];

export default function PromptExport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [problems, setProblems] = useState<ProblemOption[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('problems').select('id, title, status').order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setProblems(data); });
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedProblem || !selectedPlatform) {
      toast({ title: 'Select a problem and platform', variant: 'destructive' });
      return;
    }
    setGenerating(true);
    setFiles([]);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-prompt', {
        body: { problemId: selectedProblem, platform: selectedPlatform },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFiles(data.files || []);
      if (data.files?.length) setActiveTab(data.files[0].name);
      toast({ title: 'Prompt system generated!', description: `${data.files?.length} files ready for ${selectedPlatform}` });
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!files.length) return;
    const zip = new JSZip();
    const problemName = problems.find(p => p.id === selectedProblem)?.title || 'problem';
    const folderName = `${problemName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedPlatform}`;
    const folder = zip.folder(folderName)!;
    files.forEach(f => folder.file(f.name, f.content));
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded!', description: `${folderName}.zip` });
  };

  const handleCopyFile = (file: GeneratedFile) => {
    navigator.clipboard.writeText(file.content);
    setCopiedFile(file.name);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground">AI Prompt Export</h1>
          <p className="text-muted-foreground mt-1">
            Transform your structured problem data into production-ready prompt systems for any AI platform
          </p>
        </motion.div>

        {/* Problem Selector */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Select Problem</CardTitle>
            <CardDescription>Choose which problem profile to export</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedProblem} onValueChange={setSelectedProblem}>
              <SelectTrigger className="w-full md:w-96">
                <SelectValue placeholder="Choose a problem..." />
              </SelectTrigger>
              <SelectContent>
                {problems.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        p.status === 'completed' ? 'bg-green-400' :
                        p.status === 'execution' ? 'bg-blue-400' :
                        p.status === 'monitoring' ? 'bg-yellow-400' : 'bg-muted-foreground'
                      )} />
                      {p.title}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!problems.length && (
              <p className="text-sm text-muted-foreground mt-2">No problems found. Create one in Problem Intake first.</p>
            )}
          </CardContent>
        </Card>

        {/* Platform Selector */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Target Platform</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map(platform => {
              const Icon = platform.icon;
              const isSelected = selectedPlatform === platform.id;
              return (
                <motion.button
                  key={platform.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all duration-200",
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/50 bg-card/60 hover:border-border hover:bg-card/80"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg bg-background/50", isSelected && "bg-primary/20")}>
                      <Icon className={cn("w-5 h-5", platform.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{platform.name}</span>
                        <span className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{platform.files}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{platform.description}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleGenerate}
            disabled={!selectedProblem || !selectedPlatform || generating}
            size="lg"
            className="gap-2"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Generate Prompt System</>
            )}
          </Button>
          {generating && (
            <span className="text-sm text-muted-foreground animate-pulse">
              AI is building your custom prompt system...
            </span>
          )}
        </div>

        {/* File Preview */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-lg">Generated Files</CardTitle>
                    <CardDescription>{files.length} files ready for download</CardDescription>
                  </div>
                  <Button onClick={handleDownloadZip} className="gap-2">
                    <Download className="w-4 h-4" /> Download ZIP
                  </Button>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                      {files.map(f => (
                        <TabsTrigger key={f.name} value={f.name} className="text-xs">
                          {f.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {files.map(f => (
                      <TabsContent key={f.name} value={f.name}>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 z-10 gap-1"
                            onClick={() => handleCopyFile(f)}
                          >
                            {copiedFile === f.name ? (
                              <><Check className="w-3 h-3" /> Copied</>
                            ) : (
                              <><Copy className="w-3 h-3" /> Copy</>
                            )}
                          </Button>
                          <pre className="bg-background/80 border border-border/50 rounded-lg p-4 overflow-x-auto max-h-[500px] overflow-y-auto text-sm text-foreground/90 whitespace-pre-wrap font-mono">
                            {f.content}
                          </pre>
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
