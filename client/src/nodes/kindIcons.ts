import {
  AlertTriangle,
  Box,
  Cloud,
  Database,
  Globe,
  HardDrive,
  Monitor,
  Network,
  Server,
  Shield,
} from 'lucide-react';
import type { NodeKind } from '../domain/kinds';

export const KIND_ICONS: Record<NodeKind, typeof Server> = {
  internet: Globe,
  loadbalancer: Network,
  webserver: Monitor,
  apigateway: Cloud,
  backendservice: Server,
  database: Database,
  storage: HardDrive,
  waf: Shield,
  vpc: Box,
  attacker: AlertTriangle,
};
