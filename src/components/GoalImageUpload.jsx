import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Camera, Upload, X, ImageIcon, Sparkles } from 'lucide-react';

/**
 * GoalImageUpload - Component that lets users upload an aspirational image for their goal
 * e.g. a photo of a Yamaha R3, a dream house, etc.
 * 
 * Works with Supabase Storage when configured, otherwise uses localStorage (base64)
 */
export default function GoalImageUpload({ goalId, currentImageUrl, onImageChange, compact = false }) {
    const { configured, uploadGoalImage, user } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentImageUrl || null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = useCallback(async (file) => {
        if (!file || !file.type.startsWith('image/')) return;

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            alert('La imagen es demasiado grande (máx. 5MB)');
            return;
        }

        setIsUploading(true);

        // Create a preview immediately
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);

        if (configured && user) {
            // Upload to Supabase Storage
            const { url, error } = await uploadGoalImage(file, goalId);
            if (!error && url) {
                onImageChange?.(url);
            } else {
                // Fallback: store as base64 in localStorage
                const readerB64 = new FileReader();
                readerB64.onload = (e) => {
                    const base64 = e.target.result;
                    saveImageLocally(goalId, base64);
                    onImageChange?.(base64);
                };
                readerB64.readAsDataURL(file);
            }
        } else {
            // No Supabase: store base64 locally
            const readerB64 = new FileReader();
            readerB64.onload = (e) => {
                const base64 = e.target.result;
                saveImageLocally(goalId, base64);
                onImageChange?.(base64);
            };
            readerB64.readAsDataURL(file);
        }

        setIsUploading(false);
    }, [configured, user, goalId, uploadGoalImage, onImageChange]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }, [handleFile]);

    const handleRemove = useCallback(() => {
        setPreviewUrl(null);
        removeImageLocally(goalId);
        onImageChange?.(null);
    }, [goalId, onImageChange]);

    if (compact) {
        return (
            <div style={{ position: 'relative' }}>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                    style={{ display: 'none' }}
                />

                {previewUrl ? (
                    <div style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
                        <img
                            src={previewUrl}
                            alt="Meta aspiracional"
                            style={{
                                width: '100%', height: 140, objectFit: 'cover',
                                borderRadius: 14, display: 'block',
                            }}
                        />
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '20px 12px 8px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                                <Sparkles size={12} style={{ display: 'inline', marginRight: 4 }} />
                                Tu meta visual
                            </span>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)', border: 'none',
                                        borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
                                        color: 'white', fontSize: 11, fontWeight: 600,
                                    }}
                                >
                                    <Camera size={12} />
                                </button>
                                <button
                                    onClick={handleRemove}
                                    style={{
                                        background: 'rgba(239,68,68,0.3)', border: 'none',
                                        borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
                                        color: 'white', fontSize: 11,
                                    }}
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%', padding: '16px 12px',
                            borderRadius: 14,
                            border: '2px dashed rgba(6,214,160,0.2)',
                            background: 'rgba(6,214,160,0.03)',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 8, fontSize: 13, fontWeight: 600,
                        }}
                    >
                        <Camera size={16} style={{ color: 'var(--accent-primary)' }} />
                        Subir foto de tu meta
                    </motion.button>
                )}

                {isUploading && (
                    <div style={{
                        position: 'absolute', inset: 0, borderRadius: 14,
                        background: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <div style={{
                            width: 24, height: 24,
                            border: '2px solid rgba(6,214,160,0.3)',
                            borderTop: '2px solid var(--accent-primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.8s linear infinite',
                        }} />
                    </div>
                )}
            </div>
        );
    }

    // Full dropzone version
    return (
        <div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFile(e.target.files?.[0])}
                style={{ display: 'none' }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
                <ImageIcon size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Imagen Motivacional
            </label>

            <AnimatePresence mode="wait">
                {previewUrl ? (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}
                    >
                        <img
                            src={previewUrl}
                            alt="Imagen de tu meta aspiracional"
                            style={{
                                width: '100%', height: 200, objectFit: 'cover',
                                borderRadius: 16, display: 'block',
                            }}
                        />
                        <div style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            padding: '30px 16px 12px',
                            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                                <Sparkles size={14} style={{ display: 'inline', marginRight: 4 }} />
                                Tu meta aspiracional
                            </span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)', border: 'none',
                                        borderRadius: 10, padding: '6px 12px', cursor: 'pointer',
                                        color: 'white', fontSize: 12, fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: 4,
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <Camera size={14} /> Cambiar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRemove}
                                    style={{
                                        background: 'rgba(239,68,68,0.3)', border: 'none',
                                        borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
                                        color: 'white', backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="dropzone"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            padding: '28px 20px',
                            borderRadius: 16,
                            border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)'}`,
                            background: dragOver ? 'rgba(6,214,160,0.06)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                        }}
                    >
                        <Upload size={28} style={{ color: 'var(--accent-primary)', marginBottom: 10, opacity: 0.7 }} />
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            Sube la foto de tu meta
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                            Ej: "Yamaha R3", tu casa soñada, o cualquier meta aspiracional.
                            <br />
                            <span style={{ fontSize: 11 }}>
                                Arrastra o haz clic · JPG, PNG · Máx 5MB
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isUploading && (
                <div style={{
                    marginTop: 8, display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, color: 'var(--accent-primary)',
                }}>
                    <div style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(6,214,160,0.3)',
                        borderTop: '2px solid var(--accent-primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    Subiendo imagen...
                </div>
            )}
        </div>
    );
}

// Local storage helpers for images
function saveImageLocally(goalId, base64) {
    try {
        const images = JSON.parse(localStorage.getItem('metaflow_goal_images') || '{}');
        images[goalId] = base64;
        localStorage.setItem('metaflow_goal_images', JSON.stringify(images));
    } catch (e) {
        console.warn('Could not save image locally:', e);
    }
}

function removeImageLocally(goalId) {
    try {
        const images = JSON.parse(localStorage.getItem('metaflow_goal_images') || '{}');
        delete images[goalId];
        localStorage.setItem('metaflow_goal_images', JSON.stringify(images));
    } catch (e) {
        console.warn('Could not remove image locally:', e);
    }
}

export function getLocalGoalImage(goalId) {
    try {
        const images = JSON.parse(localStorage.getItem('metaflow_goal_images') || '{}');
        return images[goalId] || null;
    } catch {
        return null;
    }
}
