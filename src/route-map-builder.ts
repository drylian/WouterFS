import type { RouteDefinition, StructuredRouteEntry } from './types';

export function buildStructuredRouteMap(routes: RouteDefinition[]): Record<string, StructuredRouteEntry> {
    const map: Record<string, StructuredRouteEntry> = {};

    const sorted = [...routes].sort((a, b) => a.routePath.length - b.routePath.length);

    for (const route of sorted) {
        const path = route.routePath || '/';
        map[path] = {
            filePath: normalizeFilePath(route.filePath)
        };
    }

    for (const path in map) {
        if (path === '*' || path === '/' || path.includes('__error') || path.includes('__not_found')) continue;

        const parent = findParentPath(path, map);
        if (parent) {
            map[path]!.parent = parent;
            map[parent]!.children ??= [];
            map[parent]!.children!.push(path);
        } else {
            map[path]!.parent = '__root__';
            map['__root__'] ??= { filePath: '__root.tsx', children: [] };
            map['__root__'].children!.push(path);
        }
    }

    return map;
}

function normalizeFilePath(filePath: string): string {
    return filePath.replace(/^.*?routes[\\/]/, '').replace(/\\/g, '/');
}

function findParentPath(path: string, map: Record<string, StructuredRouteEntry>): string | undefined {
    const segments = path.split('/').filter(Boolean);
    while (segments.length > 0) {
        const tryPath = '/' + segments.slice(0, -1).join('/');
        if (map[tryPath]) return tryPath;
        segments.pop();
    }
    return undefined;
}