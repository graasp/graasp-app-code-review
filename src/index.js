import React from 'react';
import { render } from 'react-dom';
import Root from './components/Root';
import { mockServer, buildMockLocalContext } from '@graasp/apps-query-client';
import buildDatabase from './data/db';
import { MOCK_API } from './config/settings';
import './index.css';

// setup mocked api for cypress or standalone app
if (MOCK_API) {
  const appContext = buildMockLocalContext(window.appContext);
  // automatically append item id as a query string
  const searchParams = new URLSearchParams(window.location.search);
  if (!searchParams.get('itemId')) {
    searchParams.set('itemId', appContext.itemId);
    window.location.search = searchParams.toString();
  }
  const database = window.Cypress ? window.database : buildDatabase(appContext);
  mockServer({ database, appContext });
}

const root = document.getElementById('root');

const renderApp = (RootComponent) => {
  render(<RootComponent />, root);
};

renderApp(Root);

if (module.hot) {
  module.hot.accept('./components/Root', () => {
    const NextRoot = require('./components/Root').default;
    renderApp(NextRoot);
  });
}
