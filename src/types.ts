export interface DigestSection {
  title: string;
  content: string;
}

export interface Digest {
  date: string;
  subject: string;
  sections: DigestSection[];
  html: string;
}

export interface DigestState {
  email: string | null;
  topics: string[];
  digests: Digest[];
  enabled: boolean;
}

export interface Env {
  DIGEST_OBJECT: DurableObjectNamespace;
  ASSETS: Fetcher;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
}
