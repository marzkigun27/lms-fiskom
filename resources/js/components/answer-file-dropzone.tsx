import React, { useState, useRef, useEffect } from 'react';

export interface AnswerFileData {
    disk: string;
    path: string;
    original_name: string;
    mime_type: string;
    size_bytes: number;
    url: string;
}

interface AnswerFileDropzoneProps {
    questionId: number;
    practicumSessionId?: number;
    preliminaryTaskPeriodId?: number;
    initialValue?: string | null;
    disabled?: boolean;
    onUploadSuccess?: (data: AnswerFileData, rawJson: string) => void;
    onRemove?: () => void;
}

function parseFileJson(value?: string | null): AnswerFileData | null {
    if (!value) return null;
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && parsed.path && parsed.original_name) {
            return parsed as AnswerFileData;
        }
    } catch {
        return null;
    }
    return null;
}

function formatBytes(bytes: number, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function AnswerFileDropzone({
    questionId,
    practicumSessionId,
    preliminaryTaskPeriodId,
    initialValue,
    disabled = false,
    onUploadSuccess,
    onRemove,
}: AnswerFileDropzoneProps) {
    const [fileData, setFileData] = useState<AnswerFileData | null>(() => parseFileJson(initialValue));
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setFileData(parseFileJson(initialValue));
    }, [initialValue]);

    const handleFileSelect = async (file: File) => {
        setErrorMessage(null);

        // Validation: mime type & extension
        const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const isPdf = file.type === 'application/pdf' || ext === 'pdf';
        const isImage = file.type.startsWith('image/') || ['png', 'jpg', 'jpeg'].includes(ext);

        if (!isPdf && !isImage) {
            setErrorMessage('Format berkas tidak didukung. Harap unggah PDF, PNG, atau JPG.');
            return;
        }

        // Validation: max 10MB
        const maxBytes = 10 * 1024 * 1024;
        if (file.size > maxBytes) {
            setErrorMessage('Ukuran berkas melebihi batas maksimum 10 MB.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(10);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('question_id', String(questionId));
        if (practicumSessionId) {
            formData.append('practicum_session_id', String(practicumSessionId));
        }
        if (preliminaryTaskPeriodId) {
            formData.append('preliminary_task_period_id', String(preliminaryTaskPeriodId));
        }

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/praktikan/jawaban/upload-file');

            // Set CSRF token from cookie or meta tag
            const xsrfToken = document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')[1];
            if (xsrfToken) {
                xhr.setRequestHeader('X-XSRF-TOKEN', decodeURIComponent(xsrfToken));
            }
            xhr.setRequestHeader('Accept', 'application/json');

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percentComplete = Math.round((e.loaded / e.total) * 90);
                    setUploadProgress(percentComplete);
                }
            };

            xhr.onload = () => {
                setIsUploading(false);
                setUploadProgress(100);

                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const res = JSON.parse(xhr.responseText);
                        if (res.success && res.data) {
                            setFileData(res.data);
                            const rawJson = JSON.stringify(res.data);
                            onUploadSuccess?.(res.data, rawJson);
                        } else {
                            setErrorMessage(res.message || 'Gagal mengunggah berkas.');
                        }
                    } catch {
                        setErrorMessage('Gagal memproses respons server.');
                    }
                } else {
                    try {
                        const err = JSON.parse(xhr.responseText);
                        setErrorMessage(err.message || 'Gagal mengunggah berkas. Periksa format atau koneksi Anda.');
                    } catch {
                        setErrorMessage('Terjadi kesalahan saat mengunggah berkas.');
                    }
                }
            };

            xhr.onerror = () => {
                setIsUploading(false);
                setErrorMessage('Koneksi terputus saat mengunggah berkas.');
            };

            xhr.send(formData);
        } catch {
            setIsUploading(false);
            setErrorMessage('Terjadi kesalahan yang tidak terduga.');
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled || isUploading) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!disabled && !isUploading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleRemoveFile = () => {
        if (disabled) return;
        setFileData(null);
        setErrorMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onRemove?.();
    };

    const isPdfFile = fileData?.mime_type === 'application/pdf' || fileData?.original_name.toLowerCase().endsWith('.pdf');

    return (
        <div className="w-full space-y-3">
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
                className="hidden"
                disabled={disabled || isUploading}
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        handleFileSelect(e.target.files[0]);
                    }
                }}
            />

            {/* Error Message */}
            {errorMessage && (
                <div className="bg-rose-100 border-[3px] border-rose-800 text-rose-950 px-4 py-3 rounded-xl font-body font-bold text-xs flex items-center justify-between gap-3 neo-shadow-sm animate-shake">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-rose-800 text-lg">error</span>
                        <span>{errorMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMessage(null)}
                        className="text-rose-900 hover:text-black font-black"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Uploaded File Card */}
            {fileData ? (
                <div className="bg-surface-container-lowest border-[3px] border-primary rounded-xl p-4 neo-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-12 h-12 rounded-lg border-2 border-primary flex items-center justify-center shrink-0 ${
                            isPdfFile ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                            <span className="material-symbols-outlined text-2xl">
                                {isPdfFile ? 'picture_as_pdf' : 'image'}
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-headline font-bold text-sm text-on-surface truncate max-w-xs md:max-w-md" title={fileData.original_name}>
                                {fileData.original_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-xs text-outline font-bold">
                                    {formatBytes(fileData.size_bytes)}
                                </span>
                                <span className="text-outline text-xs">•</span>
                                <span className="inline-flex items-center gap-1 font-label text-[11px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-800">
                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                    Tersimpan
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        {fileData.url && (
                            <a
                                href={fileData.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-primary text-on-primary border-[2px] border-primary px-3 py-1.5 rounded-lg font-label font-bold text-xs uppercase neo-shadow-sm hover:neo-shadow flex items-center gap-1.5 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                Lihat Berkas
                            </a>
                        )}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-surface-container border-[2px] border-primary px-3 py-1.5 rounded-lg font-label font-bold text-xs uppercase text-on-surface neo-shadow-sm hover:neo-shadow flex items-center gap-1.5 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">refresh</span>
                                Ganti
                            </button>
                        )}
                        {!disabled && (
                            <button
                                type="button"
                                onClick={handleRemoveFile}
                                className="bg-rose-50 border-[2px] border-rose-800 px-3 py-1.5 rounded-lg font-label font-bold text-xs uppercase text-rose-800 neo-shadow-sm hover:neo-shadow flex items-center gap-1.5 transition-all"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Hapus
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                /* Dropzone Area */
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => {
                        if (!disabled && !isUploading) {
                            fileInputRef.current?.click();
                        }
                    }}
                    className={`border-[3px] border-dashed rounded-xl p-6 text-center transition-all ${
                        disabled
                            ? 'border-outline-variant bg-surface-container/50 opacity-60 cursor-not-allowed'
                            : isDragging
                            ? 'border-primary bg-primary-fixed/20 neo-shadow-md cursor-pointer scale-[1.01]'
                            : 'border-primary bg-surface-container-lowest neo-shadow hover:neo-shadow-md cursor-pointer hover:bg-surface-container/30'
                    }`}
                >
                    {isUploading ? (
                        <div className="space-y-3 py-2">
                            <div className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-primary text-3xl animate-spin">
                                    progress_activity
                                </span>
                                <span className="font-headline font-bold text-sm text-on-surface">
                                    Mengunggah berkas... {uploadProgress}%
                                </span>
                            </div>
                            <div className="w-full max-w-xs mx-auto bg-surface-container border-[2px] border-primary rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-primary h-full transition-all duration-200"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="w-12 h-12 mx-auto rounded-full bg-primary-fixed text-on-primary-fixed border-[2px] border-primary flex items-center justify-center neo-shadow-sm">
                                <span className="material-symbols-outlined text-2xl">
                                    cloud_upload
                                </span>
                            </div>
                            <div className="font-headline font-bold text-sm text-on-surface">
                                <span className="text-primary underline">Pilih berkas</span> atau seret dan lepas di sini
                            </div>
                            <p className="font-body text-xs text-outline font-medium">
                                Format yang didukung: PDF, PNG, JPG / JPEG (Maks. 10 MB)
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
