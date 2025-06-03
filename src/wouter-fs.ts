import fs from 'fs';
import { generateRouteFile } from './route-generator';
import type { WouterFSOptions, RouteDefinition } from './types';
import { displayRoutes, getAllFiles } from './utils';
import { createDefaultErrorBoundaryRoute, createDefaultNotFoundRoute, detectRouteType, ensureDefaultExport, extractMetaData, parseRoutePath, propagateAndMergeMeta } from './route-utils';

export class WouterFS {
    private options: WouterFSOptions;

    constructor(options: WouterFSOptions) {
        this.options = options;
    }

    public async build() {
        console.log('🚀 Starting route generation...');
        const { routePath, routeFile, metaPath, routeMapPath } = this.options;

        const files = getAllFiles(routePath).filter(f => /\.(tsx|jsx)$/.test(f));

        const sorted = files.sort((a, b) => {
            const order = ['root', 'layout', 'page', 'error', 'not_found'];
            return order.indexOf(detectRouteType(a)) - order.indexOf(detectRouteType(b));
        });

        const routes: RouteDefinition[] = [];

        for (const file of sorted) {
            const route = parseRoutePath(file, routePath);
            ensureDefaultExport(file, route.type);
            route.meta = extractMetaData(file);
            routes.push(route);
        }

        if (this.options.defaultNotFound && !routes.find(r => r.type === 'not_found')) {
            routes.push(createDefaultNotFoundRoute(routePath));
        }

        if (this.options.defaultErrorBoundary && !routes.find(r => r.type === 'error')) {
            routes.push(createDefaultErrorBoundaryRoute(routePath));
        }

        propagateAndMergeMeta(routes);

        displayRoutes(routes);
        generateRouteFile({
            routes,
            outputPath: routeFile,
            wouterLib: this.options.wouterLib || 'wouter',
            defaultSpinnerPath: this.options.defaultSpinnerPath,
            routeMapPath
        });

        if (metaPath) {
            const metaExport = Object.fromEntries(routes.map(r => [r.routePath, r.meta ?? {}]));
            fs.writeFileSync(metaPath, JSON.stringify(metaExport, null, 2));
        }

        console.log('🎉 Done.');
    }
}