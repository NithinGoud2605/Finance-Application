import React from 'react';
import {
    Viewer,
    SpecialZoomLevel,
    Icon,
    MinimalButton,
    Position,
    Tooltip,
} from '@react-pdf-viewer/core';
import { Worker } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import DisableScrollPlugin from './disableScrollPlugin';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/page-navigation/lib/styles/index.css';

const CustomPDFViewer = ({ fileUrl }) => {
    // Instantiate the plugins
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const disableScrollPluginInstance = DisableScrollPlugin();
    const { GoToPreviousPage, GoToNextPage } = pageNavigationPluginInstance;

    // Validate fileUrl before rendering
    const isValidUrl = fileUrl && typeof fileUrl === 'string' && fileUrl.trim().length > 0;

    if (!isValidUrl) {
        return (
            <div style={{ 
                height: '750px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                color: '#666'
            }}>
                <p>Invalid or missing PDF URL: {typeof fileUrl} - {String(fileUrl).substring(0, 50)}</p>
            </div>
        );
    }

    return (
        <div
            style={{
                height: '750px',
                position: 'relative',
                '--scale-factor': '1', // ensure the scale factor is set globally
            }}
        >
            {/* Previous Page Button */}
            <div
                style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translate(24px, -50%)',
                    zIndex: 1,
                }}
            >
                <GoToPreviousPage>
                    {(props) => (
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

            {/* Next Page Button */}
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
                    {(props) => (
                        <Tooltip
                            position={Position.BottomCenter}
                            target={
                                <MinimalButton onClick={props.onClick}>
                                    <Icon size={16}>
                                        <path d="M5.6.5,18.175,11.626a.5.5,0,0,1,0,.748L5.6,23.5" />
                                    </Icon>
                                </MinimalButton>
                            }
                            content={() => 'Next page'}
                            offset={{ left: 0, top: 8 }}
                        />
                    )}
                </GoToNextPage>
            </div>

            {/* Main PDF Viewer */}
            <Worker workerUrl="/pdf.worker.min.js">
                <Viewer
                    fileUrl={fileUrl}
                    defaultScale={SpecialZoomLevel.PageFit}
                    initialPage={0}
                    plugins={[pageNavigationPluginInstance, disableScrollPluginInstance]}
                    onDocumentLoadError={() => {
                        console.error('PDF viewer failed to load document:', fileUrl);
                    }}
                />
            </Worker>
        </div>
    );
};

export default CustomPDFViewer;
