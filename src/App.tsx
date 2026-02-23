/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/Chat/ChatArea';

export default function App() {
  return (
    <div className="flex h-screen w-full bg-[#0d0f14] text-gray-200 overflow-hidden selection:bg-[#f5a623]/30 selection:text-[#f5a623]">
      <Sidebar />
      <ChatArea />
    </div>
  );
}

