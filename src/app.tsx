import { useState, useEffect, useRef, useCallback } from "react";
import YProvider from "y-partyserver/provider";
import * as Y from "yjs";
import { Mail, Plus, X, Zap, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";
import { Switch } from "./components/ui/switch";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./components/ui/collapsible";

interface DigestSection {
  title: string;
  content: string;
}

interface DigestEntry {
  date: string;
  subject: string;
  sections: DigestSection[];
}

export function App({ digestId }: { digestId: string }) {
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [digests, setDigests] = useState<DigestEntry[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);
  const [triggerStatus, setTriggerStatus] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [synced, setSynced] = useState(false);
  const [openDigests, setOpenDigests] = useState<Set<number>>(new Set());

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<YProvider | null>(null);
  const configRef = useRef<Y.Map<unknown> | null>(null);
  const topicsArrRef = useRef<Y.Array<string> | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new YProvider(location.host, digestId, doc, {
      party: "digest-object",
    });

    const config = doc.getMap("config");
    const topicsArr = doc.getArray<string>("topics");
    const digestsArr = doc.getArray<DigestEntry>("digests");

    docRef.current = doc;
    providerRef.current = provider;
    configRef.current = config;
    topicsArrRef.current = topicsArr;

    function syncConfig() {
      const e = (config.get("email") as string) || "";
      const en = (config.get("enabled") as boolean) || false;
      // Only update email if user isn't actively editing
      if (document.activeElement !== emailInputRef.current && e) {
        setEmail(e);
      }
      setEnabled(en);
    }

    function syncTopics() {
      setTopics(topicsArr.toArray());
    }

    function syncDigests() {
      setDigests(digestsArr.toArray());
    }

    provider.on("synced", () => {
      setSynced(true);
      syncConfig();
      syncTopics();
      syncDigests();
    });

    config.observe(syncConfig);
    topicsArr.observe(syncTopics);
    digestsArr.observeDeep(syncDigests);

    provider.on("custom-message", (msg: string) => {
      const data = JSON.parse(msg);
      if (data.type === "trigger-result") {
        setGenerating(false);
        if (data.ok) {
          setTriggerStatus({ msg: "Digest generated and sent!", ok: true });
        } else {
          setTriggerStatus({ msg: data.error || "Failed", ok: false });
        }
      }
    });

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [digestId]);

  const saveEmail = useCallback(() => {
    const trimmed = email.trim();
    if (!trimmed || !configRef.current || !docRef.current) return;
    docRef.current.transact(() => {
      configRef.current!.set("email", trimmed);
      if (!configRef.current!.get("enabled")) {
        configRef.current!.set("enabled", true);
      }
    });
    setEmailStatus({ msg: "Saved!", ok: true });
    setTimeout(() => setEmailStatus(null), 3000);
  }, [email]);

  const addTopic = useCallback(() => {
    const topic = topicInput.trim();
    if (!topic || !topicsArrRef.current) return;
    if (!topicsArrRef.current.toArray().includes(topic)) {
      topicsArrRef.current.push([topic]);
    }
    setTopicInput("");
  }, [topicInput]);

  const removeTopic = useCallback((index: number) => {
    topicsArrRef.current?.delete(index, 1);
  }, []);

  const toggleEnabled = useCallback(
    (checked: boolean) => {
      configRef.current?.set("enabled", checked);
    },
    []
  );

  const triggerDigest = useCallback(() => {
    if (!providerRef.current) return;
    setGenerating(true);
    setTriggerStatus({
      msg: "This may take a minute while Claude researches your topics...",
      ok: true,
    });
    providerRef.current.sendMessage(JSON.stringify({ type: "trigger" }));
  }, []);

  const toggleDigest = useCallback((index: number) => {
    setOpenDigests((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const reversedDigests = [...digests].reverse();

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-border">
        <a href="/" className="text-primary text-2xl font-bold no-underline">
          TellyTax
        </a>
        <span className="text-muted-foreground text-sm font-mono">
          ID: {digestId.slice(0, 8)}&hellip;
        </span>
      </header>

      {!synced && (
        <div className="text-center text-muted-foreground py-8">
          Connecting...
        </div>
      )}

      {synced && (
        <div className="space-y-5">
          {/* Email Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2.5">
                <Input
                  ref={emailInputRef}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEmail()}
                />
                <Button size="sm" onClick={saveEmail}>
                  Save
                </Button>
              </div>
              {emailStatus && (
                <p
                  className={`text-sm mt-2 ${emailStatus.ok ? "text-success" : "text-destructive"}`}
                >
                  {emailStatus.msg}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Topics Card */}
          <Card>
            <CardHeader>
              <CardTitle>Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2.5">
                <Input
                  placeholder="e.g. AI regulation, quantum computing"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTopic()}
                />
                <Button size="sm" onClick={addTopic}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {topics.map((topic, i) => (
                    <Badge key={`${topic}-${i}`}>
                      {topic}
                      <button
                        onClick={() => removeTopic(i)}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Controls Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Controls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-5 flex-wrap">
                <Button
                  onClick={triggerDigest}
                  disabled={generating}
                >
                  {generating ? "Generating..." : "Generate Digest Now"}
                </Button>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <Switch
                    checked={enabled}
                    onCheckedChange={toggleEnabled}
                  />
                  Daily emails enabled
                </label>
              </div>
              {triggerStatus && (
                <p
                  className={`text-sm mt-2 ${triggerStatus.ok ? "text-success" : "text-destructive"}`}
                >
                  {triggerStatus.msg}
                </p>
              )}
            </CardContent>
          </Card>

          {/* History Card */}
          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {reversedDigests.length === 0 ? (
                <p className="text-muted-foreground italic text-center py-5">
                  No digests yet. Add topics and generate your first one!
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {reversedDigests.map((d, i) => (
                    <Collapsible
                      key={i}
                      open={openDigests.has(i)}
                      onOpenChange={() => toggleDigest(i)}
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full py-4 cursor-pointer text-left hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors">
                        <h3 className="text-sm font-medium text-foreground">
                          {d.subject}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-xs text-muted-foreground">
                            {d.date}
                          </span>
                          {openDigests.has(i) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="bg-background rounded-lg p-3 mb-4 text-sm leading-relaxed">
                          {d.sections.map((s, si) => (
                            <div key={si}>
                              <div className="text-primary font-semibold mt-3 mb-1 first:mt-0">
                                {s.title}
                              </div>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: escapeHtml(s.content).replace(
                                    /\n/g,
                                    "<br>"
                                  ),
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}
