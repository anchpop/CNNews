import { useState, useEffect, useRef, useCallback } from "react";
import YProvider from "y-partyserver/provider";
import * as Y from "yjs";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { Pencil, Check, Plus, X, ChevronDown, ChevronRight, MailCheck, Clock } from "lucide-react";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "./components/ui/collapsible";

interface DigestSection {
  title: string;
  content: string;
}

interface DigestSource {
  url: string;
  title: string;
}

interface DigestEntry {
  date: string;
  subject: string;
  funFact?: string;
  sections: DigestSection[];
  sources?: DigestSource[];
}

type Frequency = "daily" | "every_other_day" | "weekly" | "biweekly" | "manual";

const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "every day" },
  { value: "every_other_day", label: "every other day" },
  { value: "weekly", label: "every week" },
  { value: "biweekly", label: "every two weeks" },
  { value: "manual", label: "when I press the button" },
];

export function App({ digestId }: { digestId: string }) {
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [digests, setDigests] = useState<DigestEntry[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [topicInput, setTopicInput] = useState("");
  const [emailStatus, setEmailStatus] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);
  const [triggerStatus, setTriggerStatus] = useState<{
    msg: string;
    ok: boolean;
  } | null>(null);
  const [savedEmail, setSavedEmail] = useState("");
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [nextAlarmTime, setNextAlarmTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [justConfirmed, setJustConfirmed] = useState(false);
  const [synced, setSynced] = useState(false);
  const [openDigests, setOpenDigests] = useState<Set<number>>(new Set());

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<YProvider | null>(null);
  const configRef = useRef<Y.Map<unknown> | null>(null);
  const topicsArrRef = useRef<Y.Array<string> | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const prevConfirmedRef = useRef<boolean | null>(null);

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
      const freq = (config.get("frequency") as Frequency) || "daily";
      const conf = (config.get("confirmed") as boolean) || false;
      const alarmTime = (config.get("nextAlarmTime") as number) || null;
      setSavedEmail(e);
      setNextAlarmTime(alarmTime);
      // Only update email input if user isn't actively editing
      if (document.activeElement !== emailInputRef.current && e) {
        setEmail(e);
      }
      setEnabled(en);
      setFrequency(freq);
      const lastDigestSentAt = (config.get("lastDigestSentAt") as number) || 0;
      if (lastDigestSentAt > 0 && Date.now() - lastDigestSentAt < 120_000) {
        setGenerating(false);
        setTriggerStatus({ msg: "Digest generated and sent!", ok: true });
      } else if (lastDigestSentAt > 0) {
        // Digest finished but older than 2 minutes — clear any stale status
        setGenerating(false);
        setTriggerStatus(null);
      }
      const confirmedAt = (config.get("confirmedAt") as number) || 0;
      // Show banner on live transition OR if confirmed within last 2 minutes
      if (prevConfirmedRef.current !== null && conf && !prevConfirmedRef.current) {
        setJustConfirmed(true);
      } else if (conf && confirmedAt > 0 && Date.now() - confirmedAt < 120_000) {
        setJustConfirmed(true);
      }
      prevConfirmedRef.current = conf;
      setConfirmed(conf);
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
      // Prefill email and topics from URL query params (landing page flow)
      const params = new URLSearchParams(window.location.search);
      const prefillEmail = params.get("email");
      const prefillTopics = params.getAll("topic").filter(Boolean);
      if (prefillEmail && !config.get("email")) {
        doc.transact(() => {
          config.set("email", prefillEmail);
          config.set("enabled", true);
        });
      }
      if (prefillTopics.length > 0 && topicsArr.length === 0) {
        topicsArr.push(prefillTopics);
      }
      if (prefillEmail || prefillTopics.length > 0) {
        // Clean up URL
        window.history.replaceState({}, "", window.location.pathname);
      }
      // Always keep timezone up to date
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && config.get("timezone") !== tz) {
        config.set("timezone", tz);
      }
    });

    config.observe(syncConfig);
    topicsArr.observe(syncTopics);
    digestsArr.observeDeep(syncDigests);

    provider.on("custom-message", (msg: string) => {
      const data = JSON.parse(msg);
      if (data.type === "trigger-result") {
        if (data.ok) {
          const conf = (config.get("confirmed") as boolean) || false;
          if (!conf) {
            // Verification email — done immediately
            setGenerating(false);
            setTriggerStatus({ msg: "Verification email sent!", ok: true });
          } else {
            // Digest is generating in background — keep spinner until it arrives via Yjs
            setTriggerStatus({ msg: "Generating digest...", ok: true });
          }
        } else {
          setGenerating(false);
          setTriggerStatus({ msg: data.error || "Failed", ok: false });
        }
      } else if (data.type === "trigger-error") {
        setGenerating(false);
        setTriggerStatus({ msg: data.error || "Digest generation failed", ok: false });
      }
    });

    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [digestId]);

  useEffect(() => {
    if (!nextAlarmTime) {
      setCountdown("");
      return;
    }
    function update() {
      const diff = nextAlarmTime! - Date.now();
      if (diff <= 0) {
        setCountdown("any moment now");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours >= 1) {
        setCountdown(`${hours}h`);
      } else {
        setCountdown(`${minutes}m`);
      }
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [nextAlarmTime]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => {
      setResendCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCooldown > 0]);

  const startCooldown = useCallback(() => {
    setResendCooldown(60);
  }, []);

  const saveEmail = useCallback(() => {
    const trimmed = email.trim();
    if (!trimmed || !configRef.current || !docRef.current) return;
    if (emailInputRef.current && !emailInputRef.current.reportValidity()) return;
    docRef.current.transact(() => {
      configRef.current!.set("email", trimmed);
      if (!configRef.current!.get("enabled")) {
        configRef.current!.set("enabled", true);
      }
    });
    setSavedEmail(trimmed);
    setEditing(false);
    startCooldown();
    setTriggerStatus(null);
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

  const changeFrequency = useCallback((freq: Frequency) => {
    configRef.current?.set("frequency", freq);
  }, []);

  const triggerDigest = useCallback((isVerification = false) => {
    if (!providerRef.current) return;
    setGenerating(true);
    if (isVerification) {
      startCooldown();
      setTriggerStatus(null);
    } else {
      setTriggerStatus({
        msg: "This may take a minute while Claude researches your topics...",
        ok: true,
      });
    }
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
          Chad Nauseam News
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
          {/* Confirmation banner */}
          {savedEmail && !confirmed && (
            <div className="rounded-xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-500 p-5 flex gap-4 items-start">
              <MailCheck className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                  Please verify your email address
                </p>
                <p className="text-amber-800 dark:text-amber-300 text-sm mt-1">
                  A verification email was sent to <strong>{savedEmail}</strong>. Click the link inside to confirm and start receiving digests.
                </p>
                <Button
                  onClick={() => triggerDigest(true)}
                  disabled={generating || resendCooldown > 0}
                  size="sm"
                  variant="outline"
                  className="mt-3 border-amber-400 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:border-amber-500 dark:hover:bg-amber-950/30"
                >
                  {generating ? "Sending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend verification email"}
                </Button>
              </div>
            </div>
          )}
          {justConfirmed && (
            <div className="rounded-xl border-2 border-green-400 bg-green-50 dark:bg-green-950/30 dark:border-green-500 p-5 flex gap-4 items-start">
              <Check className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-200 text-sm">
                  You're all set!
                </p>
                <p className="text-green-800 dark:text-green-300 text-sm mt-1">
                  Your email has been confirmed. You'll start receiving digests on schedule.
                </p>
              </div>
            </div>
          )}

          {/* Controls bar — fluent sentence */}
          <div className="flex flex-wrap items-baseline justify-between gap-y-2 text-base leading-relaxed">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-2 font-medium text-foreground">
              <span>Sending</span>
              {savedEmail && !editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="text-foreground font-medium underline decoration-dotted underline-offset-2 cursor-pointer hover:text-primary transition-colors"
                >
                  {savedEmail}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <input
                    ref={emailInputRef}
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEmail()}
                    autoFocus={editing}
                    className="h-7 px-2 rounded border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring [field-sizing:content]"
                  />
                  <button onClick={saveEmail} className="text-primary hover:text-primary/80 cursor-pointer"><Check className="h-4 w-4" /></button>
                  {editing && (
                    <button onClick={() => { setEditing(false); setEmail(savedEmail); }} className="text-muted-foreground hover:text-foreground cursor-pointer"><X className="h-4 w-4" /></button>
                  )}
                </span>
              )}
              <span>a digest</span>
              <select
                value={frequency}
                onChange={(e) => changeFrequency(e.target.value as Frequency)}
                className="h-7 px-1.5 rounded border border-border bg-background text-foreground text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring [field-sizing:content]"
              >
                {FREQUENCY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {enabled && confirmed && countdown && (
                <span className="text-muted-foreground font-normal text-sm">
                  (next in {countdown})
                </span>
              )}
            </div>
            <Button
              onClick={() => triggerDigest(false)}
              disabled={generating || !confirmed}
              size="sm"
              variant="outline"
            >
              {generating ? "Generating..." : "Send now"}
            </Button>
          </div>
          {triggerStatus && (
            <p
              className={`text-sm ${triggerStatus.ok ? "text-success" : "text-destructive"}`}
            >
              {triggerStatus.msg}
            </p>
          )}

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
                <div className="mt-3 divide-y divide-border">
                  {topics.map((topic, i) => (
                    <div key={`${topic}-${i}`} className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">{topic}</span>
                      <button
                        onClick={() => removeTopic(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer p-1"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
                        <div className="bg-background rounded-lg p-3 mb-4 text-sm leading-relaxed digest-prose">
                          {d.funFact && (
                            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-400 rounded-r-lg">
                              <div className="text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wide mb-1">Did you know?</div>
                              <div className="text-amber-900 dark:text-amber-200 text-sm">{d.funFact}</div>
                            </div>
                          )}
                          {d.sections.map((s, si) => (
                            <div key={si}>
                              <div className="text-primary font-semibold mt-3 mb-1 first:mt-0">
                                {s.title}
                              </div>
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(marked.parse(s.content.trim(), { async: false }) as string),
                                }}
                              />
                            </div>
                          ))}
                          {d.sources && d.sources.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="text-primary font-semibold mb-1">Sources</div>
                              <ul className="list-disc pl-5 space-y-0.5">
                                {d.sources.map((src, si) => (
                                  <li key={si}>
                                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                      {src.title}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
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

