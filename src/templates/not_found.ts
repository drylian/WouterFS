export default `

export const metadata = {
    title: "Page not found",
};

export default function NotFoundPage() {
    return (
        <div style={styles.container}>
            <h1 style={styles.title}>404 - Page Not Found</h1>
            <p style={styles.message}>
                The page you are looking for does not exist or has been moved.
            </p>
            <a href="/" style={styles.link}>Back to home page</a> </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '2rem'
    },
    title: {
        fontSize: '3rem',
        marginBottom: '1rem',
        color: '#ff4444'
    },
    message: {
        fontSize: '1.2rem',
        marginBottom: '2rem'
    },
    link: {
        color: '#0066cc',
        textDecoration: 'none',
        fontSize: '1.1rem',
        '&:hover': {
            textDecoration: 'underline'
        }
    }
} as const;
`;