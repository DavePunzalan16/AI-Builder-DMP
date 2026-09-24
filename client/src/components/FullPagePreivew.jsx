import React, { useMemo, useState } from 'react'
import { detectDependencies } from '../utils/sandpackUtils';
import SandpackErrorMonitor from './SandpackErrorMonitor';
import { SandpackLayout, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';

const FullPagePreivew = ({files}) => {

    const [showErrorOverlay, setShowErrorOverlay] = useState(true)

    // convert livefiles to sandpack format
      const sandpackFiles = useMemo(() => {
        if(!files) return {};
        const spFiles = {};
        for (const [path, content] of Object.entries(files)) {
          spFiles[path] = { code: content }
        }
        return spFiles;
      }, [files])
    
      // detect dependencies from import statements using livefiles
      const dependencies = useMemo(() => {
        if(!files) return {};
        return detectDependencies(files)
      }, [files])

  return (
    <div className={`h-screen w-screen bg-white overflow-hidden transition-colors duration-300`}>
      <SandpackProvider template='react'
        files={sandpackFiles}
        customSetup={{ dependencies }}
        options={{
          externalResources: [
            "https://cdn.tailwindcss.com",
            "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
          ],
          logLevel: 0,
        }}
        className="h-full w-full">


        <SandpackErrorMonitor onErrorChange={setShowErrorOverlay}/>
        <SandpackLayout className="w-full h-full border-none! bg-transparent!">

          <SandpackPreview showNavigator={false} 
          showRefreshButton={false}
          showOpenInCodeSandbox={false} 
          showSandpackErrorOverlay={showErrorOverlay}
          className='h-full w-full'/>
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}

export default FullPagePreivew