import fs from 'fs';
import path from 'path';
import type { HeadMeta, RouteDefinition, RouteMeta, RouteTreeNode, RouteType } from './types';
import errorBoundary from './templates/error-boundary';
import not_found from './templates/not_found';
import page from './templates/page';
import { capitalizeWords, formatName } from './utils';

/**
 * Route-specific utility functions
 */

export function detectRouteType(filePath: string): RouteType {
    const filename = path.basename(filePath);
    if (filename.startsWith('__root.')) return 'root';
    if (filename.startsWith('__layout.')) return 'layout';
    if (filename.startsWith('__error.')) return 'error';
    if (filename.startsWith('__not_found.')) return 'not_found';
    return 'page';
}

export function parseRoutePath(filePath: string, basePath: string, cwd?: string): RouteDefinition {
    filePath = filePath.replace(/\\/g, '/');
    basePath = basePath.replace(/\\/g, '/');

    const relativePath = path.relative(basePath, filePath);
    const parsed = path.parse(relativePath);
    const type = detectRouteType(filePath);
    const isLazy = /\.(lazy|lz)\./.test(parsed.base);
    const cleanBaseName = parsed.name
        .replace(/\.(lazy|lz)$/, '')
        .replace(/\.index$/, '')
        .replace(/\.page$/, '');

    const isIndex = cleanBaseName.toLowerCase() === 'index' || cleanBaseName.toLowerCase() === 'page';

    let segments = parsed.dir.split(path.sep).filter(Boolean);

    if (type === 'root') {
        return {
            filePath,
            importPath: toImportPath(basePath, relativePath, cwd),
            routePath: '',
            type,
            isLazy: false
        };
    }

    if (type === 'layout') {
        return {
            filePath,
            importPath: toImportPath(basePath, relativePath, cwd),
            routePath: `/${segments.join('/')}`,
            type,
            isLazy: false
        };
    }

    if (!isIndex) segments.push(cleanBaseName);

    let routePath = '/' + segments
        .filter(Boolean)
        .join('/')
        .replace(/\[([^\]]+)\]/g, (_, param) => `:${param}`)
        .replace(/\.\.\./g, '*');

    routePath = routePath.replace(/\/index$/i, '').replace(/\/page$/i, '');

    return {
        filePath,
        importPath: toImportPath(basePath, relativePath, cwd),
        routePath,
        type,
        isLazy
    };
}

export function toImportPath(basePath: string, relativePath: string, cwd?: string): string {
    const fullPath = path.join(basePath, relativePath).replace(/\.[^/.]+$/, '');
    
    if (cwd) {
        const relative = path.relative(cwd, fullPath);
        
        const importPath = path.isAbsolute(relative) 
            ? `./${relative}`
            : relative.startsWith('.') 
                ? relative 
                : `./${relative}`;
        
        return importPath.replace(/\\/g, '/');
    }
    
    return `./${path.join(path.basename(basePath), relativePath)
        .replace(/\.[^/.]+$/, '')
        .replace(/\\/g, '/')}`;
}

export function extractMetaData(filePath: string): RouteMeta | undefined {
    const content = fs.readFileSync(filePath, 'utf-8');
    const meta: RouteMeta = {};
    let found = false;

    const headMatch = content.match(/export\s+(const|let|var)\s+Head\s*[:=]\s*({[\s\S]*?})/);
    if (headMatch) {
        try {
            const cleaned = headMatch[2]!.replace(/,\s*}/g, '}').replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
            meta.head = JSON.parse(cleaned);
            found = true;
        } catch { }
    }

    const sitemapMatch = content.match(/export\s+(const|let|var)\s+Sitemap\s*[:=]\s*({[\s\S]*?})/);
    if (sitemapMatch) {
        try {
            const cleaned = sitemapMatch[2]!.replace(/,\s*}/g, '}').replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
            meta.sitemap = JSON.parse(cleaned);
            found = true;
        } catch { }
    }

    if (/export\s+default\s+async\s+function/.test(content)) {
        meta.isAsync = true;
        found = true;
    }

    const spinner = content.match(/\/\/\s*@spinner\s*([^\s]+)/);
    if (spinner) {
        meta.spinnerPath = spinner[1];
        found = true;
    }

    return found ? meta : undefined;
}

export function ensureDefaultExport(filePath: string, type: RouteType): void {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (/export\s+default/.test(content)) return;

    const templates = {
        layout: [
            "export default function Layout({ children }: { children: React.ReactNode }) {",
            "   return <div>{children}</div>;",
            "}"
        ].join("\n"),
        root: [
            "export default function Root({ children }: { children: React.ReactNode }) {",
            "   return <>{children}</>;",
            "}"
        ].join("\n"),
        error: errorBoundary,
        not_found: not_found,
        page: page
    };

    fs.writeFileSync(filePath, (templates[type] || templates.page));
}

export function createDefaultNotFoundRoute(basePath: string): RouteDefinition {
    const filePath = path.join(basePath, '__not_found.tsx');
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `export default function NotFound() { return <div>404 - Page Not Found</div>; }`);
    }
    return {
        filePath,
        importPath: `@/${path.basename(basePath)}/__not_found`,
        routePath: '*',
        type: 'not_found',
        isLazy: false
    };
}

export function createDefaultErrorBoundaryRoute(basePath: string): RouteDefinition {
    const filePath = path.join(basePath, '__error.tsx');
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, `
            import { ErrorBoundary } from 'react-error-boundary';
            
            export default function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
                return (
                    <ErrorBoundary fallback={<div>Something went wrong</div>}>
                        {children}
                    </ErrorBoundary>
                );
            }
        `);
    }
    return {
        filePath,
        importPath: `@/${path.basename(basePath)}/__error`,
        routePath: '__error',
        type: 'error',
        isLazy: false,
        errorBoundary: true
    };
}

export function propagateAndMergeMeta(routes: RouteDefinition[]): void {
    const root = routes.find(r => r.type === 'root')?.meta;
    const layouts = routes.filter(r => r.type === 'layout').map(r => [r.routePath, r.meta]);

    for (const route of routes) {
        if (route.type !== 'page') continue;
        const layoutMeta = layouts.find(([prefix]) => route.routePath.startsWith(prefix as never))?.[1];
        route.meta = {
            head: mergeHeadMeta(root?.head, (layoutMeta as any)?.head, route.meta?.head),
            sitemap: Object.assign({}, root?.sitemap, (layoutMeta as any)?.sitemap, route.meta?.sitemap),
            isAsync: route.meta?.isAsync,
            spinnerPath: route.meta?.spinnerPath
        };
    }
}

function mergeHeadMeta(...list: (HeadMeta | undefined)[]): HeadMeta {
    return list.reduce<HeadMeta>((acc, next) => {
        if (!next) return acc;
        return {
            title: next.title || acc.title,
            description: next.description || acc.description,
            keywords: [...new Set([...(acc.keywords || []), ...(next.keywords || [])])],
            canonical: next.canonical || acc.canonical,
            meta: [...(acc.meta || []), ...(next.meta || [])],
            links: [...(acc.links || []), ...(next.links || [])]
        };
    }, {});
}

export function buildRouteTree(
    routes: RouteDefinition[],
    nodes: RouteTreeNode[]
): RouteTreeNode[] {
    const layouts = routes.filter(r => r.type === 'layout');
    const layoutMap = new Map<string, RouteTreeNode>();

    for (const node of nodes) {
        if (node.route.type === 'layout') {
            layoutMap.set(node.route.routePath, node);
        }
    }

    const rootLevel: RouteTreeNode[] = [];

    for (const node of nodes) {
        if (node.route.type !== 'page' && node.route.type !== 'error' && node.route.type !== 'not_found') continue;

        const layout = findClosestLayout(node.route.routePath, layouts);
        if (layout) {
            const parent = layoutMap.get(layout.routePath);
            parent?.children.push(node);
        } else {
            rootLevel.push(node);
        }
    }

    for (const layoutNode of layoutMap.values()) {
        const parentLayout = findClosestLayout(
            layoutNode.route.routePath,
            layouts.filter(l => l.routePath !== layoutNode.route.routePath)
        );
        if (parentLayout) {
            const parent = layoutMap.get(parentLayout.routePath);
            parent?.children.push(layoutNode);
        } else {
            rootLevel.push(layoutNode);
        }
    }

    return rootLevel;
}

export function findClosestLayout(path: string, layouts: RouteDefinition[]): RouteDefinition | undefined {
    return layouts
        .filter(l => path.startsWith(l.routePath))
        .sort((a, b) => b.routePath.length - a.routePath.length)[0];
}

export function findWrappers(routePath: string, routes: RouteDefinition[], selfPath: string): RouteDefinition[] {
    return routes
        .filter(r =>
            (r.type === 'layout' || r.type === 'error') &&
            r.routePath !== selfPath &&
            routePath.startsWith(r.routePath)
        )
        .sort((a, b) => a.routePath.length - b.routePath.length);
}

export function componentNameFromRoute(route: RouteDefinition, id: number): string {
    const name = capitalizeWords(formatName(path.basename(route.importPath).replace(/\.[tj]sx?$/, '')));
    return `${capitalizeWords(route.type)}${name}_${id}`.replaceAll(" ", "");
}

export function lexRoutes(routes: RouteDefinition[], defaultSpinnerPath?: string): RouteTreeNode[] {
    const nodeMap = new Map<string, RouteTreeNode>();
    const treeNodes: RouteTreeNode[] = [];

    routes.forEach((route, index) => {
        const componentName = componentNameFromRoute(route, index);
        const isLazy = !!route.isLazy;
        const spinnerPath = route.meta?.spinnerPath || defaultSpinnerPath;

        const node: RouteTreeNode = {
            id: index,
            route,
            componentName,
            suspenseWrapper: isLazy,
            spinnerName: spinnerPath ? `Spinner_${index}` : undefined,
            importStatement: isLazy
                ? `const ${componentName} = React.lazy(() => import('${route.importPath}'));` +
                (spinnerPath ? `\nimport Spinner_${index} from '${spinnerPath}';` : '')
                : `import ${componentName} from '${route.importPath}';`,
            children: [],
            wrappers: []
        };

        treeNodes.push(node);
        nodeMap.set(route.routePath, node);
    });

    for (const node of treeNodes) {
        const wrapperDefs = findWrappers(node.route.routePath, routes, node.route.routePath);
        node.wrappers = wrapperDefs
            .map(w => nodeMap.get(w.routePath))
            .filter((n): n is RouteTreeNode => !!n);
    }

    return treeNodes;
}

export function renderRouteTree(nodes: RouteTreeNode[], indent = 6): string {
    return nodes.map(node => renderRouteNode(node, indent)).join('\n');
}

function renderRouteNode(node: RouteTreeNode, indent: number): string {
    const pad = (n: number) => ' '.repeat(n);
    const isNotFound = node.route.type === 'not_found';
    const isError = node.route.type === 'error';

    const routePath = isNotFound ? '*' : node.route.routePath;

    let inner = `<${node.componentName} />`;

    if (node.suspenseWrapper) {
        const fallback = node.spinnerName
            ? `<${node.spinnerName} />`
            : '<div>Loading...</div>';

        inner = `
${pad(indent + 2)}<Suspense fallback={${fallback}}>
${pad(indent + 4)}${inner}
${pad(indent + 2)}</Suspense>`.trim();
    }

    const wrappers = node.wrappers || [];
    for (const wrapper of wrappers.reverse()) {
        inner = `
${pad(indent + 2)}<${wrapper.componentName}>
${pad(indent + 4)}${inner}
${pad(indent + 2)}</${wrapper.componentName}>`.trim();
    }
    if (isError) return '';

    return `
${pad(indent)}<Route path="${routePath}" component={() => (
${pad(indent + 2)}${inner}
${pad(indent)})} />`.trim();
}