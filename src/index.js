/** @jsx createElement */
import {createElement} from 'react';
import {render} from 'react-dom';
import App from './App';

import 'semantic-ui-css/semantic.css';
import './styles/index.css';

const rootEl = document.getElementById('root');

render(<App />, rootEl);

if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    render(<NextApp />, rootEl);
  });
}
