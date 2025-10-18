import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css'; // Pastikan CSS Quill diimpor

// Define the component's props
interface QuillEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const QuillEditor: React.FC<QuillEditorProps> = ({ value, onChange, className }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sourceCode, setSourceCode] = useState('');

    const handleOpenSourceModal = () => {
        if (quillRef.current) {
            const currentHtml = quillRef.current.root.innerHTML;
            setSourceCode(currentHtml);
            setIsModalOpen(true);
        }
    };

    const handleSaveSource = () => {
        if (quillRef.current) {
            quillRef.current.deleteText(0, quillRef.current.getLength());
            quillRef.current.clipboard.dangerouslyPasteHTML(0, sourceCode);
        }
        setIsModalOpen(false);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    useEffect(() => {
        if (editorRef.current && toolbarRef.current && !quillRef.current) {
            const quill = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: {
                        container: toolbarRef.current,
                        handlers: {
                            'source': handleOpenSourceModal
                        }
                    }
                },
            });

            quillRef.current = quill;

            if (value) {
                quill.clipboard.dangerouslyPasteHTML(value);
            }

            quill.on('text-change', () => {
                const editorContent = quill.root.innerHTML;
                if (editorContent === '<p><br></p>') {
                    onChange('');
                } else {
                    onChange(editorContent);
                }
            });
        }
    }, []); // Dependensi kosong agar Quill hanya inisialisasi sekali

    useEffect(() => {
        // Sinkronkan value prop dengan editor HANYA jika value berubah
        // dan tidak sama dengan konten editor saat ini
        if (quillRef.current && value !== quillRef.current.root.innerHTML) {
            // Gunakan || '' untuk menangani value null/undefined
            quillRef.current.clipboard.dangerouslyPasteHTML(value || '');
        }
    }, [value]); // Hanya jalankan saat prop `value` berubah

    return (
        <>
            <div className={className}>
                {/* Toolbar Quill */}
                <div ref={toolbarRef}>
                    <span className="ql-formats">
                        <select className="ql-header" defaultValue="">
                            <option value="1">Heading 1</option>
                            <option value="2">Heading 2</option>
                            <option value="3">Heading 3</option>
                            <option value="">Normal</option>
                        </select>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-bold"></button>
                        <button className="ql-italic"></button>
                        <button className="ql-underline"></button>
                        <button className="ql-strike"></button>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-list" value="ordered"></button>
                        <button className="ql-list" value="bullet"></button>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-link"></button>
                        <button className="ql-image"></button>
                        {/* <button className="ql-code-block"></button> */}
                        <button className="ql-source" title="Edit Source"><i className="fa-solid fa-code"></i></button>
                    </span>
                    <span className="ql-formats">
                        <button className="ql-clean"></button>
                    </span>
                    <span className="ql-formats">
                    </span>
                </div>
                {/* Editor Quill */}
                <div ref={editorRef} style={{ height: '250px', borderTop: '1px solid #ccc' }} />
            </div>

            {/* --- MODAL DENGAN TAILWIND CSS --- */}
            {isModalOpen && (
                <div 
                    // Overlay
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onClick={handleCloseModal} // Tutup modal saat klik overlay
                >
                    <div
                        // Panel Modal
                        className="bg-white rounded-lg shadow-xl w-full max-w-3xl flex flex-col gap-4 p-6"
                        onClick={(e) => e.stopPropagation()} // Cegah klik di dalam modal menutup modal
                    >
                        {/* Header Modal */}
                        <h3 className="text-xl font-semibold text-gray-900">
                            Edit HTML Source
                        </h3>

                        {/* Form/Textarea */}
                        <div>
                            <label htmlFor="html-source-editor" className="block text-sm font-medium text-gray-700 mb-1">
                                Source Code
                            </label>
                            <textarea
                                id="html-source-editor"
                                className="w-full h-80 p-3 border border-gray-300 rounded-md font-mono text-sm
                                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                           bg-gray-50 text-gray-900"
                                value={sourceCode}
                                onChange={(e) => setSourceCode(e.target.value)}
                            />
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCloseModal}
                                className="py-2 px-4 rounded-md font-medium
                                           bg-gray-100 text-gray-800 
                                           hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSource}
                                className="py-2 px-4 rounded-md font-medium 
                                           text-white bg-blue-600 
                                           hover:bg-blue-700 transition-colors"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuillEditor;