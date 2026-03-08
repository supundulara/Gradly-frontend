import Navbar from './Navbar';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-14">
                {children}
            </main>
        </div>
    );
}
