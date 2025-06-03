import React from 'react';

import { Router, Route, Switch } from 'wouter';
import RootRoot_0 from './routes/__root';
import LayoutLayout_1 from './routes/test/__layout';
import PageIdIndex_2 from './routes/test/[id].index';
import PageIndex_3 from './routes/index';
import ErrorError_4 from './routes/__error';
import NotFoundNotFound_5 from './routes/__not_found';

export function WouterFSRoutes() {
  return (
    <RootRoot_0>
    <ErrorError_4>
  <Router>
  <Switch>
<Route path="/test/:id" component={() => (
            <LayoutLayout_1>
              <PageIdIndex_2 />
            </LayoutLayout_1>
          )} />
<Route path="/" component={() => (
            <PageIndex_3 />
          )} />

<Route path="*" component={() => (
            <NotFoundNotFound_5 />
          )} />
  </Switch>
</Router>
</ErrorError_4>
    </RootRoot_0>
  );
}