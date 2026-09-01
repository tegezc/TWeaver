export const ARCHITECTURE_KINDS = [
  'internet',
  'loadbalancer',
  'webserver',
  'apigateway',
  'backendservice',
  'database',
  'storage',
  'waf',
  'vpc',
] as const;

export type ArchitectureKind = (typeof ARCHITECTURE_KINDS)[number];

export const NODE_KINDS = [...ARCHITECTURE_KINDS, 'attacker'] as const;
export type NodeKind = (typeof NODE_KINDS)[number];

export const STRIDE = [
  'spoofing',
  'tampering',
  'repudiation',
  'information_disclosure',
  'denial_of_service',
  'elevation_of_privilege',
] as const;
export type Stride = (typeof STRIDE)[number];

export const PATCH_TYPES = [
  'waf',
  'encrypt',
  'private_access',
  'rate_limit',
  'vpc',
] as const;
export type PatchType = (typeof PATCH_TYPES)[number];

export type NodeConfig = {
  publicAccess: boolean;
  encrypted: boolean;
  rateLimited: boolean;
};

export type ThreatFinding = {
  stride: Stride;
  description: string;
};

export const KIND_LABELS: Record<NodeKind, string> = {
  internet: 'Internet',
  loadbalancer: 'Load Balancer',
  webserver: 'Web Server',
  apigateway: 'API Gateway',
  backendservice: 'Backend Service',
  database: 'Database',
  storage: 'Object Storage',
  waf: 'WAF',
  vpc: 'Private VPC',
  attacker: 'Attacker',
};

export const KIND_SLUG: Record<NodeKind, string> = {
  internet: 'internet',
  loadbalancer: 'load-balancer',
  webserver: 'webserver',
  apigateway: 'api-gateway',
  backendservice: 'backend',
  database: 'database',
  storage: 'storage',
  waf: 'waf',
  vpc: 'vpc',
  attacker: 'attacker',
};

export const STRIDE_LABELS: Record<Stride, string> = {
  spoofing: 'Spoofing',
  tampering: 'Tampering',
  repudiation: 'Repudiation',
  information_disclosure: 'Information Disclosure',
  denial_of_service: 'Denial of Service',
  elevation_of_privilege: 'Elevation of Privilege',
};

export const PATCH_LABELS: Record<PatchType, string> = {
  waf: 'WAF inline',
  encrypt: 'Encryption at rest',
  private_access: 'Private access',
  rate_limit: 'Rate limiting',
  vpc: 'Private VPC',
};

export function defaultConfig(kind: NodeKind): NodeConfig {
  const publicKinds: NodeKind[] = ['internet', 'webserver', 'apigateway', 'loadbalancer'];
  return {
    publicAccess: publicKinds.includes(kind),
    encrypted: false,
    rateLimited: false,
  };
}

export function nextNodeId(kind: NodeKind, existingIds: string[]): string {
  const slug = KIND_SLUG[kind];
  let n = 1;
  while (existingIds.includes(`${slug}-${n}`)) n += 1;
  return `${slug}-${n}`;
}

export function isArchitectureKind(value: string): value is ArchitectureKind {
  return (ARCHITECTURE_KINDS as readonly string[]).includes(value);
}

export function isStride(value: string): value is Stride {
  return (STRIDE as readonly string[]).includes(value);
}

export function isPatchType(value: string): value is PatchType {
  return (PATCH_TYPES as readonly string[]).includes(value);
}
