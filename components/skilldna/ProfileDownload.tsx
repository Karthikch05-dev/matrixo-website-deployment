// ============================================================
// Profile Download Buttons - PDF & JPG Export
// Uses window.print() for PDF and html2canvas for JPG
// Handles glass morphism / backdrop-filter cleanup for clean capture
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
        // Add a class so print CSS can render content properly
        document.body.classList.add('printing-profile');
        setTimeout(() => {
            window.print();
            // Remove class after print dialog closes
            setTimeout(() => document.body.classList.remove('printing-profile'), 1000);
        }, 100);
    };

    const handleJPGDownload = async () => {
        if (!targetRef.current) return;
        setDownloading(true);

        try {
            const html2canvas = (await import('html2canvas')).default;

            // Temporarily replace backdrop-filter glass effects with solid backgrounds
            // html2canvas cannot render backdrop-filter, causing black boxes
            const el = targetRef.current;
            const elementsWithStyle = el.querySelectorAll<HTMLElement>('[style]');
            const savedStyles: { el: HTMLElement; style: string }[] = [];

            elementsWithStyle.forEach((child) => {
                const computed = getComputedStyle(child) as any;
                const hasBackdrop = computed.backdropFilter && computed.backdropFilter !== 'none';
                const hasWebkitBackdrop = computed['webkitBackdropFilter'] && computed['webkitBackdropFilter'] !== 'none';

                if (hasBackdrop || hasWebkitBackdrop) {
                    savedStyles.push({ el: child, style: child.getAttribute('style') || '' });

                    // Determine if dark or light mode
                    const isDark = document.documentElement.classList.contains('dark');
                    const bg = computed.backgroundColor;

                    // Replace with solid fallback
                    child.style.backdropFilter = 'none';
                    (child.style as any)['webkitBackdropFilter'] = 'none';

                    // If background is nearly transparent, set a solid fallback
                    if (!bg || bg === 'rgba(0, 0, 0, 0)' || bg.includes('0.0')) {
                        child.style.backgroundColor = isDark ? '#1a1a2e' : '#ffffff';
                    } else if (bg.includes('rgba')) {
                        // Make semi-transparent backgrounds more opaque
                        child.style.backgroundColor = isDark ? '#1e1e35' : '#f8f9fa';
                    }
                }
            });

            const canvas = await html2canvas(el, {
                backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a12' : '#f9fafb',
                scale: 2,
                useCORS: true,
                allowTaint: true,
                logging: false,
                windowWidth: 1200,
                onclone: (clonedDoc) => {
                    // In the cloned document, strip all backdrop-filter and fix backgrounds
                    const clonedEl = clonedDoc.querySelector('[data-profile-capture]') || clonedDoc.body;
                    const allElements = clonedEl.querySelectorAll<HTMLElement>('*');
                    const isDark = document.documentElement.classList.contains('dark');

                    allElements.forEach((node) => {
                        const style = getComputedStyle(node) as any;
                        if (style.backdropFilter !== 'none' || (style['webkitBackdropFilter'] && style['webkitBackdropFilter'] !== 'none')) {
                            node.style.backdropFilter = 'none';
                            (node.style as any)['webkitBackdropFilter'] = 'none';
                            if (!node.style.backgroundColor || node.style.backgroundColor === 'transparent') {
                                node.style.backgroundColor = isDark ? '#1e1e35' : '#ffffff';
                            }
                        }
                    });
                }
            });

            // Restore original styles
            savedStyles.forEach(({ el: child, style }) => {
                child.setAttribute('style', style);
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
