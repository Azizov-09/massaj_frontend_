// ═══════════════════════════════════════════════════════
//  API Layer Hub — Pediatric Massage CRM
// ═══════════════════════════════════════════════════════

import { ApiClient } from './client';
import { AuthApi } from './auth';
import { ChildrenApi } from './children';
import { ParentsApi } from './parents';
import { SpecialistsApi } from './specialists';
import { ServicesApi } from './services';
import { AppointmentsApi } from './appointments';
import { SessionsApi } from './sessions';
import { ClinicalApi } from './clinical';
import { FinanceApi } from './finance';
import { PlatformApi } from './platform';
import { AnalyticsApi } from './analytics';
import { PortalApi } from './portal';

export * from './client';
export * from './types';
export * from './auth';
export * from './children';
export * from './parents';
export * from './specialists';
export * from './services';
export * from './appointments';
export * from './sessions';
export * from './clinical';
export * from './finance';
export * from './platform';
export * from './analytics';
export * from './portal';

export class AppApi extends ApiClient {
  public auth: AuthApi;
  public children: ChildrenApi;
  public parents: ParentsApi;
  public specialists: SpecialistsApi;
  public services: ServicesApi;
  public appointments: AppointmentsApi;
  public sessions: SessionsApi;
  public clinical: ClinicalApi;
  public finance: FinanceApi;
  public platform: PlatformApi;
  public analytics: AnalyticsApi;
  public portal: PortalApi;

  constructor(baseUrl?: string) {
    super(baseUrl);
    this.auth = new AuthApi(this);
    this.children = new ChildrenApi(this);
    this.parents = new ParentsApi(this);
    this.specialists = new SpecialistsApi(this);
    this.services = new ServicesApi(this);
    this.appointments = new AppointmentsApi(this);
    this.sessions = new SessionsApi(this);
    this.clinical = new ClinicalApi(this);
    this.finance = new FinanceApi(this);
    this.platform = new PlatformApi(this);
    this.analytics = new AnalyticsApi(this);
    this.portal = new PortalApi(this);
  }
}

export const api = new AppApi();
