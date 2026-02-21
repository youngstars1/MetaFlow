// Auxiliares de Inteligencia MetaFlow

export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(date);
}

export function formatDateShort(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CL', {
        month: 'short',
        day: 'numeric',
    }).format(date);
}

export function daysRemaining(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    const diffTime = target - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

export function weeksRemaining(targetDate) {
    return Math.ceil(daysRemaining(targetDate) / 7);
}

export function monthsRemaining(targetDate) {
    const now = new Date();
    const target = new Date(targetDate);
    let months = (target.getFullYear() - now.getFullYear()) * 12;
    months += target.getMonth() - now.getMonth();
    return Math.max(0, months);
}

export function calculateSavingsRecommendation(remainingAmount, targetDate) {
    const days = daysRemaining(targetDate);
    const weeks = weeksRemaining(targetDate);
    const months = monthsRemaining(targetDate);

    return {
        daily: days > 0 ? Math.ceil(remainingAmount / days) : 0,
        weekly: weeks > 0 ? Math.ceil(remainingAmount / weeks) : 0,
        monthly: months > 0 ? Math.ceil(remainingAmount / months) : 0,
    };
}

export function getProgressPercentage(current, target) {
    if (target <= 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
}

export function getMotivationalQuote(progress) {
    const quotes = {
        low: [
            "Cada pequeño ahorro cuenta para tu meta. Sigue así.",
            "La disciplina es la clave del éxito financiero.",
            "Visualiza tu objetivo y mantén el enfoque.",
            "Pequeños pasos llevan a grandes resultados.",
        ],
        medium: [
            "Ya estás a mitad de camino. No te detengas ahora.",
            "Tu constancia está dando frutos. Sigue con el plan.",
            "El progreso es evidente. Estás dominando tus finanzas.",
            "Mantén el ritmo, tu meta está cada vez más cerca.",
        ],
        high: [
            "¡Casi lo logras! Un último esfuerzo para alcanzar tu meta.",
            "Estás en la recta final. Tu disciplina ha sido impecable.",
            "Falta muy poco para completar este gran objetivo.",
            "La victoria financiera está a solo unos pasos.",
        ],
        complete: [
            "¡META ALCANZADA! Disfruta de tu logro financiero.",
            "Objetivo completado con éxito. Eres un experto en disciplina.",
            "Hito registrado. ¿Cuál será tu próximo gran desafío?",
        ],
    };

    let category;
    if (progress >= 100) category = 'complete';
    else if (progress >= 70) category = 'high';
    else if (progress >= 35) category = 'medium';
    else category = 'low';

    const categoryQuotes = quotes[category];
    return categoryQuotes[Math.floor(Math.random() * categoryQuotes.length)];
}

export function getPriorityLabel(priority) {
    switch (priority) {
        case 'alta': return 'Prioridad Alta';
        case 'media': return 'Prioridad Media';
        case 'baja': return 'Prioridad Baja';
        default: return 'Sin Prioridad';
    }
}

export function getTransactionCategories(type) {
    const categories = {
        ingreso: [
            { value: 'salario', label: 'Sueldo Principal' },
            { value: 'freelance', label: 'Trabajos Freelance' },
            { value: 'negocio', label: 'Ingresos de Negocio' },
            { value: 'inversiones', label: 'Inversiones' },
            { value: 'otros_ingresos', label: 'Otros Ingresos' },
        ],
        gasto: [
            { value: 'alimentacion', label: 'Comida y Restaurantes' },
            { value: 'transporte', label: 'Transporte y Viajes' },
            { value: 'entretenimiento', label: 'Ocio y Entretenimiento' },
            { value: 'servicios', label: 'Servicios Básicos' },
            { value: 'educacion', label: 'Cursos y Educación' },
            { value: 'salud', label: 'Salud y Bienestar' },
            { value: 'ropa', label: 'Ropa y Accesorios' },
            { value: 'hogar', label: 'Gastos del Hogar' },
            { value: 'otros_gastos', label: 'Otros Gastos' },
        ],
        ahorro: [
            { value: 'ahorro_meta', label: 'Ahorro para Meta' },
        ],
    };
    return categories[type] || [];
}

export function isToday(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
}

export function getStartOfWeek() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff));
}

export function getStartOfMonth() {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
}
