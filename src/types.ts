export interface DigestSection {
  title: string;
  content: string;
}

export interface DigestSource {
  url: string;
  title: string;
}

export interface Digest {
  date: string;
  subject: string;
  sections: DigestSection[];
  sources: DigestSource[];
  html: string;
}

export interface DigestState {
  email: string | null;
  topics: string[];
  digests: Digest[];
  enabled: boolean;
  confirmed: boolean;
}

export interface Env {
  DIGEST_OBJECT: DurableObjectNamespace;
  ASSETS: Fetcher;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
}
