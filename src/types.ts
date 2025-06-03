export type RouteType = 'page' | 'layout' | 'root' | 'error' | 'not_found';


export interface GenerateOptions {
  routes: RouteDefinition[];
  outputPath: string;
  wouterLib: 'wouter' | 'wouter-preact';
  defaultSpinnerPath?: string;
  routeMapPath?: string;
}

export interface MetaTag {
    name?: string;
    property?: string;
    content: string;
    [key: string]: any;
}

export interface HeadMeta {
    title?: string;
    description?: string;
    keywords?: string[];
    canonical?: string;
    meta?: MetaTag[];
    links?: { rel: string; href: string; [key: string]: any }[];
}

export interface SitemapEntry {
    path: string;
    lastmod?: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
}

export interface RouteMeta {
    head?: HeadMeta;
    sitemap?: SitemapEntry;
    isAsync?: boolean;
    spinnerPath?: string;
}

export interface RouteDefinition {
    filePath: string;
    importPath: string;
    routePath: string;
    type: RouteType;
    isLazy: boolean;
    meta?: RouteMeta;
    errorBoundary?: boolean;
}

export interface StructuredRouteEntry {
    filePath: string;
    parent?: string;
    children?: string[];
}

export type StructuredRouteMap = Record<string, StructuredRouteEntry>;

export interface RouteTreeNode {
    id: number;
    route: RouteDefinition;
    componentName: string;
    spinnerName?: string;
    suspenseWrapper: boolean;
    importStatement: string;
    children: RouteTreeNode[];
    wrappers?: RouteTreeNode[]
}

export interface WouterFSOptions {
    cwd?:string;
    routePath: string;
    routeFile: string;
    metaPath?: string;
    routeMapPath?: string;
    wouterLib?: 'wouter' | 'wouter-preact';
    defaultNotFound?: boolean;
    defaultErrorBoundary?: boolean;
    defaultSpinnerPath?: string;
}