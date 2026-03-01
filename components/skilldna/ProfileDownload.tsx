// ============================================================
// Profile Download Buttons - PDF & JPG Export
// Uses window.print() for PDF and html2canvas for JPG
// ============================================================

'use client';

import { useState } from 'react';
import { FaFilePdf, FaImage, FaSpinner } from 'react-icons/fa';

interface ProfileDownloadProps {
    targetRef: React.RefObject<HTMLElement | null>;
    userName?: string;
}

export default function ProfileDownload({ targetRef, userName }: ProfileDownloadProps) {
    const [downloading, setDownloading] = useState(false);

    const handlePDFDownload = () => {
        window.print();
    };

    const handleJPGDownload = async () => {
        if (!targetRef.current) return;
        setDownloading(true);

        try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(targetRef.current, {
                backgroundColor: '#0a0a0f',
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: 1200,
            });

            const link = document.createElement('a');
            link.download = `${userName || 'profile'}-matrixo-skilldna.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.95);
            link.click();
        } catch (error) {
            console.error('Failed to generate image:', error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="flex items-center gap-3 print:hidden">
            <button
                onClick={handlePDFDownload}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-medium text-sm hover:from-red-500 hover:to-rose-500 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/30"
            >
                <FaFilePdf />
                Download PDF
            </button>
            <button
                onClick={handleJPGDownload}
                disabled={downloading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium text-sm hover:from-blue-500 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50"
            >
                {downloading ? <FaSpinner className="animate-spin" /> : <FaImage />}
                {downloading ? 'Generating...' : 'Download JPG'}
            </button>
        </div>
    );
}
