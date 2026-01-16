import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';

import { Demo } from './Demo';
import { Landing } from './Landing';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
      </Routes>
    </BrowserRouter>
  );
}
