// ═══════════════════════════════════════════════════════
//  API Layer Hub — Pediatric Massage CRM
// ═══════════════════════════════════════════════════════

import { ApiClient } from "./client";
import { AuthApi } from "./auth";
import { ChildrenApi } from "./children";
import { ParentsApi } from "./parents";
import { SpecialistsApi } from "./specialists";
import { ServicesApi } from "./services";
import { ClinicalApi } from "./clinical";
import { FinanceApi } from "./finance";
import { PlatformApi } from "./platform";
import { PortalApi } from "./portal";
import { AdminsApi } from "./admins";
import { ClinicWorkflowApi } from "./workflow";

export * from "./admins";
export * from "./auth";
export * from "./children";
export * from "./client";
export * from "./clinical";
export * from "./finance";
export * from "./parents";
export * from "./platform";
export * from "./portal";
export * from "./services";
export * from "./specialists";
export * from "./types";
export * from "./workflow";

export class AppApi extends ApiClient {
  public auth: AuthApi;
  public children: ChildrenApi;
  public parents: ParentsApi;
  public specialists: SpecialistsApi;
  public services: ServicesApi;
  public workflow: ClinicWorkflowApi;
  public clinical: ClinicalApi;
  public finance: FinanceApi;
  public platform: PlatformApi;
  public portal: PortalApi;
  public admins: AdminsApi;

  constructor(baseUrl?: string) {
    super(baseUrl);
    this.auth = new AuthApi(this);
    this.children = new ChildrenApi(this);
    this.parents = new ParentsApi(this);
    this.specialists = new SpecialistsApi(this);
    this.services = new ServicesApi(this);
    this.workflow = new ClinicWorkflowApi(this);
    this.clinical = new ClinicalApi(this);
    this.finance = new FinanceApi(this);
    this.platform = new PlatformApi(this);
    this.portal = new PortalApi(this);
    this.admins = new AdminsApi(this);
  }
}

export const api = new AppApi();
