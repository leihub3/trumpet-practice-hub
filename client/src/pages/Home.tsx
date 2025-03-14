import * as React from 'react';
import { Icon, MinimalButton, Position, SpecialZoomLevel, Tooltip, Viewer, ScrollMode } from '@react-pdf-viewer/core';
import { pageNavigationPlugin, RenderGoToPageProps } from '@react-pdf-viewer/page-navigation';
import { useEffect, useState } from 'react';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

import disableScrollPlugin from './disableScrollPlugin';

interface HomeProps {
    fileUrl: string  | null;
}

const Home: React.FC<HomeProps> = ({ fileUrl }) => {
    const disableScrollPluginInstance = disableScrollPlugin();
    const pageNavigationPluginInstance = pageNavigationPlugin();

    const { GoToNextPage, GoToPreviousPage } = pageNavigationPluginInstance;

    const [initialPage, setInitialPage] = useState(2); // Set the initial page to render

    useEffect(() => {
        // Optionally, you can set the initial page dynamically based on some condition
        setInitialPage(2); // Example: Set to page 2
    }, []);

    return (
        <div
            className="rpv-core__viewer"
            style={{
                border: '1px solid rgba(0, 0, 0, 0.3)',
                height: '100vh',
                position: 'relative',
                marginTop: '32px',
            }}
        >
            <div
                style={{
                    left: 0,
                    position: 'absolute',
                    top: '50%',
                    transform: 'translate(24px, -50%)',
                    zIndex: 1,
                }}
            >
                <GoToPreviousPage>
                    {(props: RenderGoToPageProps) => (
                        <Tooltip
                            position={Position.BottomCenter}
                            target={
                                <MinimalButton onClick={props.onClick}>
                                    <Icon size={16}>
                                        <path d="M18.4.5,5.825,11.626a.5.5,0,0,0,0,.748L18.4,23.5" />
                                    </Icon>
                                </MinimalButton>
                            }
                            content={() => 'Previous page'}
                            offset={{ left: 0, top: 8 }}
                        />
                    )}
                </GoToPreviousPage>
            </div>

            <div
                style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translate(-24px, -50%)',
                    zIndex: 1,
                }}
            >
                <GoToNextPage>
                    {(props: RenderGoToPageProps) => (
                        <Tooltip
                            position={Position.BottomCenter}
                            target={
                                <MinimalButton onClick={props.onClick}>
                                    <Icon size={16}>
                                        <path d="M5.651,23.5,18.227,12.374a.5.5,0,0,0,0-.748L5.651.5" />
                                    </Icon>
                                </MinimalButton>
                            }
                            content={() => 'Next page'}
                            offset={{ left: 0, top: 8 }}
                        />
                    )}
                </GoToNextPage>
            </div>

            {fileUrl && (
                <Viewer
                    fileUrl={fileUrl}
                    plugins={[disableScrollPluginInstance, pageNavigationPluginInstance]}
                    defaultScale={SpecialZoomLevel.PageFit}
                    initialPage={initialPage} // Set the initial page here
                />
            )}
        </div>
    );
};

export default Home;