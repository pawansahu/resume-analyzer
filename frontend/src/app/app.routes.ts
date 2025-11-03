import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home/home.component").then((m) => m.HomeComponent),
  },
  {
    path: "login",
    loadComponent: () => import("./pages/auth/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "register",
    loadComponent: () => import("./pages/auth/register/register.component").then((m) => m.RegisterComponent),
  },
  {
    path: "dashboard",
    loadComponent: () => import("./pages/dashboard/dashboard.component").then((m) => m.DashboardComponent),
  },
  {
    path: "pricing",
    loadComponent: () => import("./pages/pricing/pricing.component").then((m) => m.PricingComponent),
  },
  {
    path: "upload",
    loadComponent: () => import("./pages/upload/upload.component").then((m) => m.UploadComponent),
  },
  {
    path: "contact",
    loadComponent: () => import("./pages/contact/contact.component").then((m) => m.ContactComponent),
  },
  {
    path: "profile",
    loadComponent: () => import("./pages/profile/profile.component").then((m) => m.ProfileComponent),
  },
  {
    path: "analysis/:id",
    loadComponent: () => import("./pages/analysis-details/analysis-details.component").then((m) => m.AnalysisDetailsComponent),
  },
  {
    path: "shared/:token",
    loadComponent: () => import("./pages/shared-analysis/shared-analysis.component").then((m) => m.SharedAnalysisComponent),
  },
  {
    path: "all-analyses",
    loadComponent: () => import("./pages/all-analyses/all-analyses.component").then((m) => m.AllAnalysesComponent),
  },
  {
    path: "**",
    redirectTo: "",
  },
];
