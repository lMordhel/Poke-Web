import { AuthProvider } from '@/features/auth';
import { CartProvider } from '@/features/cart';
import { ActivityProvider } from '@/features/dashboard';

export const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <ActivityProvider>
                <CartProvider>
                    {children}
                </CartProvider>
            </ActivityProvider>
        </AuthProvider>
    );
};
