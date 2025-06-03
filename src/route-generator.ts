import fs from 'fs';
import path from 'path';
import type { GenerateOptions } from './types';
import { buildStructuredRouteMap } from './route-map-builder';
import { lexRoutes, renderRouteTree } from './route-utils';

export function generateRouteFile(options: GenerateOptions) {
  const { routes, outputPath, wouterLib, defaultSpinnerPath, routeMapPath } = options;

  const treeNodes = lexRoutes(routes, defaultSpinnerPath);
  const usesSuspense = treeNodes.some(n => n.suspenseWrapper);

  const root = treeNodes.find(n => n.route.type === 'root');
  const globalErrorBoundary = treeNodes.find(
    n => n.route.type === 'error' && n.route.routePath === '/__error'
  );

  const rootOpen = root ? [`<${root.componentName}>`] : [];
  const rootClose = root ? [`</${root.componentName}>`] : [];

  const importStatements = Array.from(
    new Set(treeNodes.flatMap(n => [n.importStatement, ...(n.wrappers || []).map(w => w.importStatement)]))
  ).join('\n');

  const renderableRoutes = treeNodes.filter(n =>
    ['page', 'not_found'].includes(n.route.type) ||
    (n.route.type === 'error' && n.route.routePath !== '__error')
  );

  const routeJSX = renderRouteTree(renderableRoutes, 10);

  const routerInner = `
<Router>
  <Switch>
${routeJSX}
  </Switch>
</Router>`.trim();

  const wrappedRouter = globalErrorBoundary
    ? `<${globalErrorBoundary.componentName}>\n  ${routerInner}\n</${globalErrorBoundary.componentName}>`
    : routerInner;

  const content = `
import React from 'react';
${usesSuspense ? `import { Suspense } from 'react';` : ''}
import { Router, Route, Switch } from '${wouterLib}';
${importStatements}

export function WouterFSRoutes() {
  return (
    ${rootOpen.join('\n')}
    ${wrappedRouter}
    ${rootClose.join('\n')}
  );
}
`.trim();

  const dir = path.dirname(outputPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, content, 'utf-8');

  if (routeMapPath) {
    const structured = buildStructuredRouteMap(routes);
    const mapDir = path.dirname(routeMapPath);
    fs.mkdirSync(mapDir, { recursive: true });
    fs.writeFileSync(routeMapPath, JSON.stringify(structured, null, 2));
  }
}
